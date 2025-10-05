from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db import get_session
from app.exceptions.http_exceptions import ConversationNotFoundException
from app.models import Conversations, Users
from app.schemas.conversation import ConversationDetailSchema, ConversationSchema
from app.services.auth import get_current_user

router = APIRouter()


@router.get("/conversations", response_model=list[ConversationSchema])
async def list_conversations(
    session: AsyncSession = Depends(get_session),
    current_user: Users = Depends(get_current_user),
):
    query = select(Conversations).where(Conversations.user_id == current_user.id).order_by(Conversations.updated_at.desc())
    result = await session.execute(query)
    return result.scalars().all()


@router.get("/conversations/{conversation_id}", response_model=ConversationDetailSchema)
async def get_conversation_history(
    conversation_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: Users = Depends(get_current_user),
):
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
    return conversation
