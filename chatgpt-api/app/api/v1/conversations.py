# main.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db import get_session
from app.models import Conversations
from app.schemas.conversation import ConversationDetailSchema, ConversationSchema

router = APIRouter()


# -------- Endpoints --------
@router.get("/conversations", response_model=list[ConversationSchema])
async def list_conversations(session: AsyncSession = Depends(get_session)):
    user_id = 1
    query = select(Conversations).where(Conversations.user_id == user_id).order_by(Conversations.created_at.desc())
    result = await session.execute(query)
    return result.scalars().all()


@router.get("/conversations/{conversation_id}", response_model=ConversationDetailSchema)
async def get_conversation_history(conversation_id: int, session: AsyncSession = Depends(get_session)):
    user_id = 1
    query = select(Conversations).where(Conversations.id == conversation_id, Conversations.user_id == user_id).options(selectinload(Conversations.messages))
    result = await session.execute(query)
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation
