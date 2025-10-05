from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db import get_session
from app.exceptions.http_exceptions import ConversationNotFoundException
from app.models import Conversation, User
from app.schemas.conversation import ConversationSchema, ConversationDetailSchema
from app.services.auth import get_current_user

router = APIRouter()


@router.get("/conversations", response_model=list[ConversationSchema])
async def list_conversation(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    query = select(Conversation).where(Conversation.user_id == current_user.id).order_by(Conversation.updated_at.desc())
    result = await session.execute(query)
    return result.scalars().all()


@router.get("/conversations/{conversation_id}", response_model=ConversationDetailSchema)
async def get_conversation(
    conversation_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
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
    return conversation
