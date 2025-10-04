from datetime import datetime
from typing import List

from message import MessageSchema
from pydantic import BaseModel


class ConversationSchema(BaseModel):
    id: int
    title: str
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationDetailSchema(ConversationSchema):
    messages: List[MessageSchema]
