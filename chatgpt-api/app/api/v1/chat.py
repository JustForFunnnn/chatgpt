import logging
from datetime import datetime

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic_ai import Agent
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import MessageRole, SSEventType
from app.db import get_session
from app.exceptions.http_exceptions import ConversationNotFoundException
from app.llm import get_agent
from app.llm.tools import suggest_title
from app.models import User
from app.schemas import ChatRequestSchema, GeneratedTitleOutputSchema
from app.services.chat import (
    SSEvent,
    create_conversation,
    create_message,
    get_user_conversation_with_messages,
    messages_to_model_messages,
    trim_message_history,
)
from app.services.user import get_current_user

router = APIRouter()

logger = logging.getLogger("app")


@router.post("/chat")
async def chat(
    chat_in: ChatRequestSchema,
    session: AsyncSession = Depends(get_session),
    agent: Agent = Depends(get_agent),
    current_user: User = Depends(get_current_user),
):
    conversation_id = chat_in.conversation_id

    message_history = []
    if conversation_id:
        conversation = await get_user_conversation_with_messages(session, conversation_id, current_user.id)
        if not conversation:
            raise ConversationNotFoundException()

        message_history = messages_to_model_messages(conversation.messages)
        message_history = trim_message_history(message_history)
    else:
        title = await suggest_title(agent, chat_in.user_input)
        conversation = await create_conversation(session, title, current_user.id)

    await create_message(session, conversation.id, current_user.id, MessageRole.USER, chat_in.user_input)
    conversation.updated_at = datetime.now()
    session.add(conversation)
    await session.flush()

    async def stream_chat_response_generator():
        full_response_content = ""
        try:
            async with agent.run_stream(chat_in.user_input, message_history=message_history) as result:
                async for chunk in result.stream_text(delta=True):
                    full_response_content += chunk
                    yield str(SSEvent(SSEventType.DELTA, chunk))

            if full_response_content:
                await create_message(session, conversation.id, current_user.id, MessageRole.ASSISTANT, full_response_content)
            yield str(SSEvent(SSEventType.DONE))
        except Exception as e:
            logger.error(f"stream/save error: {e}", exc_info=True)
            yield str(SSEvent(SSEventType.ERROR, "An internal server error occurred."))
            return

    headers = {
        "X-Conversation-Id": str(conversation.id),
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
    }
    return StreamingResponse(stream_chat_response_generator(), media_type="text/event-stream", headers=headers)
