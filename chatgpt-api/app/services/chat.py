import json
import logging
from typing import Any, List

from fastapi import APIRouter
from pydantic_ai import ModelMessage, ModelRequest, ModelResponse, TextPart, UserPromptPart
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.enums import MessageRole, SSEventType
from app.models import Conversation, Message

router = APIRouter()

logger = logging.getLogger("app")


class SSEvent:
    def __init__(self, type: SSEventType, text: str = None):
        self.type = type
        payload: dict[str, Any] = {}
        if text is not None:
            payload["text"] = text
        self.payload = payload

    def __str__(self) -> str:
        body = json.dumps(self.payload, ensure_ascii=False)
        return f"event: {self.type.value}\ndata: {body}\n\n"


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


async def get_user_conversation_with_messages(session: AsyncSession, conversation_id: int, user_id: int) -> Conversation:
    query = (
        select(Conversation)
        .where(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id,
        )
        .options(selectinload(Conversation.messages))
    )
    result = await session.execute(query)
    return result.scalar_one_or_none()


async def list_user_conversations(session: AsyncSession, user_id: int) -> List[Conversation]:
    query = select(Conversation).where(Conversation.user_id == user_id).order_by(Conversation.updated_at.desc())
    result = await session.execute(query)
    return result.scalars().all()


async def create_conversation(session: AsyncSession, title: str, user_id: int) -> Conversation:
    conversation = Conversation(
        title=title,
        user_id=user_id,
    )
    session.add(conversation)
    await session.flush()
    return conversation


async def create_message(session: AsyncSession, conversation_id: int, user_id: int, role: MessageRole, content: str) -> Message:
    message = Message(
        user_id=user_id,
        conversation_id=conversation_id,
        role=role,
        content=content,
    )
    session.add(message)
    await session.flush()
    return message
