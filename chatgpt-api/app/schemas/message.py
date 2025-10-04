from datetime import datetime

from pydantic import BaseModel

from app.core.enums import MessageRole


class MessageSchema(BaseModel):
    id: int
    role: MessageRole
    content: str
    created_at: datetime

    class Config:
        from_attributes = True
