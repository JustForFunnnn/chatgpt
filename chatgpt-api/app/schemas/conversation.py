from datetime import datetime
from typing import List

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.message import MessageSchema


class ConversationSchema(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConversationDetailSchema(ConversationSchema):
    messages: List[MessageSchema]


class GeneratedTitleOutputSchema(BaseModel):
    title: str = Field(..., description="A short, concise title for the conversation")
