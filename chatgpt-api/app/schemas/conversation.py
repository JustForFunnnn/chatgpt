from datetime import datetime
from typing import List

from pydantic import BaseModel

from app.schemas.message import MessageSchema


class ConversationSchema(BaseModel):
    id: int
    title: str
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationDetailSchema(ConversationSchema):
    messages: List[MessageSchema]
