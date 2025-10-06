from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.core.enums import MessageRole


class MessageSchema(BaseModel):
    id: int
    role: MessageRole
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConversationSchema(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConversationDetailSchema(ConversationSchema):
    messages: List[MessageSchema]


class ChatRequestSchema(BaseModel):
    user_input: str
    conversation_id: Optional[int] = None


class GeneratedTitleOutputSchema(BaseModel):
    title: str = Field(..., description="A short, concise title for the conversation", max_length=50, min_length=3)
