# main.py
from typing import AsyncIterator
from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select, insert
from sqlalchemy.orm import joinedload, selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from pydantic_ai import Agent, ModelMessage, ModelRequest, ModelResponse, UserPromptPart, TextPart
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.azure import AzureProvider

from settings import app_settings
from db import get_session, async_engine
from models import Base, Conversations, Messages

# LLM
model = OpenAIChatModel(
    app_settings.AI_MODEL_NAME,
    provider=AzureProvider(
        azure_endpoint=app_settings.AZURE_ENDPOINT,
        api_version=app_settings.AZURE_API_VERSION,
        api_key=app_settings.AZURE_API_KEY.get_secret_value(),
    ),
)
agent = Agent(model=model)

app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------- Schemas --------
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

# Base schema for a message
class MessageSchema(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

# Base schema for a conversation
class ConversationSchema(BaseModel):
    id: int
    title: str
    created_at: datetime

    class Config:
        from_attributes = True

# Schema for detailed conversation view, including messages
class ConversationDetailSchema(ConversationSchema):
    messages: List[MessageSchema]

# Schema for the chat request body
class ChatRequestSchema(BaseModel):
    user_input: str
    conversation_id: Optional[int] = None

# -------- Endpoints --------
@app.get("/api/v1/conversations", response_model=list[ConversationSchema])
async def list_conversations(session: AsyncSession = Depends(get_session)):
    user_id = 1
    query = select(Conversations).where(Conversations.user_id == user_id).order_by(Conversations.created_at.desc())
    result = await session.execute(query)
    return result.scalars().all()


@app.get("/api/v1/conversations/{conversation_id}", response_model=ConversationDetailSchema)
async def get_conversation_history(conversation_id: int, session: AsyncSession = Depends(get_session)):
    user_id = 1
    query = (
        select(Conversations)
        .where(Conversations.id == conversation_id, Conversations.user_id == user_id)
        .options(selectinload(Conversations.messages))
    )
    result = await session.execute(query)
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation


def messages_to_model_messages(
    rows: List[Messages]
) -> List[ModelMessage]:
    model_msgs = []
    for m in rows:
        if m.role == "user":
            model_msgs.append(ModelRequest(parts=[UserPromptPart(content=m.content)]))
        else:  # assistant
            model_msgs.append(ModelResponse(parts=[TextPart(content=m.content)]))
    return model_msgs

@app.post("/api/v1/chat")
async def chat(
    payload: ChatRequestSchema,
    session: AsyncSession = Depends(get_session)
):
    conversation_id = payload.conversation_id
    
    user_id = 1

    message_history = []
    if conversation_id:
        query = (
            select(Conversations)
            .where(Conversations.id == conversation_id, Conversations.user_id == user_id)
            .options(selectinload(Conversations.messages))
        )
        result = await session.execute(query)
        conversation = result.scalar_one_or_none()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        message_history = messages_to_model_messages(conversation.messages)
    else:
        title_generation_prompt = (
            "Suggest a short, concise title for the following user query. "
            f"Respond with only the title and nothing else: '{payload.user_input}'"
        )
        generated_title = (await agent.run(title_generation_prompt)).output
        
        conversation = Conversations(title=generated_title.strip().strip('"'), user_id=user_id)
        session.add(conversation)
        await session.flush()  # 刷新以获取新 conversation.id

    # 保存用户的消息
    user_message = Messages(
        conversation_id=conversation.id, 
        role="user", 
        content=payload.user_input
    )
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
            if full_response_content: # 确保有内容才保存
                assistant_message = Messages(
                    conversation_id=conversation.id,
                    role="assistant",
                    content=full_response_content
                )
                session.add(assistant_message)
                # 这里的 flush 和 commit 将由 get_session 依赖自动处理
        except Exception as e:
            # 处理流式传输或保存过程中的错误
            print(f"An error occurred during streaming/saving: {e}")
            # 你也可以在这里 yield 一个错误消息给客户端
            yield f"error: An error occurred processing your request.\n\n"

    # 在响应头中返回 conversation_id，方便客户端跟进
    headers = {"X-Conversation-Id": str(conversation.id)}
    return StreamingResponse(stream_and_save_response(), media_type="text/event-stream", headers=headers)


