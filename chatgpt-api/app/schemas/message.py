from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.core.enums import MessageRole


class MessageSchema(BaseModel):
    id: int
    role: MessageRole
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)