import logging
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from app.exceptions.http_exceptions import ConversationNotFoundException
from app.models import User
from app.schemas import ConversationDetailSchema, ConversationSchema
from app.services.chat import get_user_conversation_with_messages, list_user_conversations
from app.services.user import get_current_user

router = APIRouter()


logger = logging.getLogger("app")

@router.get("/conversations", response_model=list[ConversationSchema])
async def list_conversations(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await list_user_conversations(session, current_user.id)


@router.get("/conversations/{conversation_id}", response_model=ConversationDetailSchema)
async def get_conversation(
    conversation_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    cs =  await list_user_conversations(session, current_user.id)

    conversation = await get_user_conversation_with_messages(session, conversation_id, current_user.id)
    if not conversation:
        raise ConversationNotFoundException()
    
    cs =  await list_user_conversations(session, current_user.id)
    return conversation
