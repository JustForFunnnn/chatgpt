from typing import List

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic_ai import Agent, ModelMessage, ModelRequest, ModelResponse, TextPart, UserPromptPart
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.enums import MessageRole
from app.db import get_session
from app.llm import get_agent
from app.models import Conversations, Messages
from app.schemas.chat import ChatRequestSchema

router = APIRouter()


def messages_to_model_messages(rows: List[Messages]) -> List[ModelMessage]:
    model_msgs = []
    for m in rows:
        if m.role == MessageRole.USER:
            model_msgs.append(ModelRequest(parts=[UserPromptPart(content=m.content)]))
        else:
            model_msgs.append(ModelResponse(parts=[TextPart(content=m.content)]))
    return model_msgs


@router.post("/chat")
async def chat(
    payload: ChatRequestSchema,
    session: AsyncSession = Depends(get_session),
    agent: Agent = Depends(get_agent),
):
    conversation_id = payload.conversation_id

    user_id = 1

    message_history = []
    if conversation_id:
        query = select(Conversations).where(Conversations.id == conversation_id, Conversations.user_id == user_id).options(selectinload(Conversations.messages))
        result = await session.execute(query)
        conversation = result.scalar_one_or_none()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        message_history = messages_to_model_messages(conversation.messages)
    else:
        title_generation_prompt = "Suggest a short, concise title for the following user query. " f"Respond with only the title and nothing else: '{payload.user_input}'"
        generated_title = (await agent.run(title_generation_prompt)).output

        conversation = Conversations(title=generated_title.strip().strip('"'), user_id=user_id)
        session.add(conversation)
        await session.flush()  # 刷新以获取新 conversation.id

    # 保存用户的消息
    user_message = Messages(conversation_id=conversation.id, role="user", content=payload.user_input)
    session.add(user_message)
    await session.flush()

    async def stream_and_save_response():
        """
        这个生成器有两个职责：
        1. 实时地将 LLM 的块(chunk) yield 给客户端。
        2. 在流结束后，将完整的消息保存到数据库。
        """
        full_response_content = ""
        try:
            async with agent.run_stream(payload.user_input, message_history=message_history) as result:
                async for piece in result.stream_text(delta=True):
                    full_response_content += piece
                    yield f"data: {piece}\n\n"

            # 2. 流结束后，保存完整的助手消息
            if full_response_content:  # 确保有内容才保存
                assistant_message = Messages(conversation_id=conversation.id, role="assistant", content=full_response_content)
                session.add(assistant_message)
                # 这里的 flush 和 commit 将由 get_session 依赖自动处理
        except Exception as e:
            # 处理流式传输或保存过程中的错误
            print(f"An error occurred during streaming/saving: {e}")
            # 你也可以在这里 yield 一个错误消息给客户端
            yield "error: An error occurred processing your request.\n\n"

    # 在响应头中返回 conversation_id，方便客户端跟进
    headers = {"X-Conversation-Id": str(conversation.id)}
    return StreamingResponse(stream_and_save_response(), media_type="text/event-stream", headers=headers)
