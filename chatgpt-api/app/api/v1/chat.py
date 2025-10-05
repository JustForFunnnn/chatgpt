import logging
from datetime import datetime
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
from app.models import Conversation, Message, User
from app.schemas import ChatRequestSchema, GeneratedTitleOutputSchema
from app.services.auth import get_current_user

router = APIRouter()

logger = logging.getLogger("app")


def trim_message_history(msgs: List[ModelMessage], max_chars=12000, pin_heads=2) -> List[ModelMessage]:
    head = msgs[:pin_heads]
    tail = msgs[pin_heads:]
    acc, out = 0, []
    for m in reversed(tail):
        size = sum(len(getattr(p, "content", "")) for p in m.parts)
        if acc + size > max_chars:
            break
        out.append(m)
        acc += size
    return head + list(reversed(out))


def messages_to_model_messages(rows: List[Message]) -> List[ModelMessage]:
    model_msgs = []
    for m in rows:
        if m.role == MessageRole.USER:
            model_msgs.append(ModelRequest(parts=[UserPromptPart(content=m.content)]))
        else:
            model_msgs.append(ModelResponse(parts=[TextPart(content=m.content)]))
    return model_msgs

import json
from enum import Enum

class SSEventType(Enum):
    DELTA = "delta"
    DONE = "done"
    ERROR = "error"

class SSEvent:
    def __init__(self, type: SSEventType, data: str):
        self.type = type
        self.data = data

    def __str__(self):
        payload = {"type": self.type.value, "data": self.data}
        return f"data: {json.dumps(payload)}\n\n"


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
        query = (
            select(Conversation)
            .where(
                Conversation.id == conversation_id,
                Conversation.user_id == current_user.id,
            )
            .options(selectinload(Conversation.messages))
        )
        result = await session.execute(query)
        conversation = result.scalar_one_or_none()
        if not conversation:
            raise ConversationNotFoundException()
        message_history = messages_to_model_messages(conversation.messages)
        message_history = trim_message_history(message_history)
    else:
        title_generation_prompt = f"Suggest a short, concise title for the following user query: '{chat_in.user_input}'"
        title_out_obj = await agent.run(title_generation_prompt, output_type=GeneratedTitleOutputSchema)
        conversation = Conversation(
            title=title_out_obj.output.title,
            user_id=current_user.id,
        )
        session.add(conversation)
        await session.flush()

    user_message = Message(conversation_id=conversation.id, role=MessageRole.USER, user_id=current_user.id, content=chat_in.user_input)
    conversation.updated_at = datetime.now()
    session.add(user_message)
    await session.flush()

    async def stream_and_save_response():
        full_response_content = ""
        try:
            async with agent.run_stream(chat_in.user_input, message_history=message_history) as result:
                async for chunk in result.stream_text(delta=True):
                    full_response_content += chunk
                    yield str(SSEvent(type=SSEventType.DELTA, data=chunk))

            if full_response_content:
                assistant_message = Message(
                    user_id=current_user.id,
                    conversation_id=conversation.id,
                    role=MessageRole.ASSISTANT,
                    content=full_response_content,
                )
                session.add(assistant_message)
            yield str(SSEvent(type=SSEventType.DONE, data=""))
        except Exception as e:
            logger.error(f"An error occurred during streaming/saving: {e}", exc_info=True)
            yield str(SSEvent(SSEventType.ERROR, "An internal server error occurred."))
            return

    headers = {
        "X-Conversation-Id": str(conversation.id),
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
    }
    return StreamingResponse(stream_and_save_response(), media_type="text/event-stream", headers=headers)
