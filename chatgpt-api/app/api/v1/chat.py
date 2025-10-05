import logging
from typing import List

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic_ai import Agent, ModelMessage, ModelRequest, ModelResponse, TextPart, UserPromptPart
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.enums import MessageRole
from app.db import get_session
from app.exceptions.http_exceptions import ConversationNotFoundException
from app.llm import get_agent
from app.models import Conversations, Messages, Users
from app.schemas.chat import ChatRequestSchema
from app.services.auth import get_current_user

router = APIRouter()

logger = logging.getLogger("app")


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
    current_user: Users = Depends(get_current_user),
):
    conversation_id = payload.conversation_id

    message_history = []
    if conversation_id:
        query = (
            select(Conversations)
            .where(
                Conversations.id == conversation_id,
                Conversations.user_id == current_user.id,
            )
            .options(selectinload(Conversations.messages))
        )
        result = await session.execute(query)
        conversation = result.scalar_one_or_none()
        if not conversation:
            raise ConversationNotFoundException()
        message_history = messages_to_model_messages(conversation.messages)
    else:
        title_generation_prompt = f"Suggest a short, concise title for the following user query. Respond with only the title and nothing else: '{payload.user_input}'"
        generated_title = (await agent.run(title_generation_prompt)).output

        conversation = Conversations(
            title=generated_title.strip().strip('"'),
            user_id=current_user.id,
        )
        session.add(conversation)
        await session.flush()

    user_message = Messages(conversation_id=conversation.id, role=MessageRole.USER, user_id=current_user.id, content=payload.user_input)
    session.add(user_message)
    await session.flush()

    async def stream_and_save_response():
        full_response_content = ""
        try:
            async with agent.run_stream(payload.user_input, message_history=message_history) as result:
                async for piece in result.stream_text(delta=True):
                    full_response_content += piece
                    yield f"data: {piece}\n\n"

            if full_response_content:
                assistant_message = Messages(
                    conversation_id=conversation.id,
                    role="assistant",
                    content=full_response_content,
                )
                session.add(assistant_message)
        except Exception as e:
            logger.error(f"An error occurred during streaming/saving: {e}", exc_info=True)
            yield "data: error: An error occurred processing your request.\n\n"

    headers = {"X-Conversation-Id": str(conversation.id)}
    return StreamingResponse(stream_and_save_response(), media_type="text/event-stream", headers=headers)
