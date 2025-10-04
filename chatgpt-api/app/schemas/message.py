from pydantic import BaseModel
from datetime import datetime

from app.core.enums import MessageRole

# Base schema for a message
class MessageSchema(BaseModel):
    id: int
    role: MessageRole 
    content: str
    created_at: datetime

    class Config:
        from_attributes = True
