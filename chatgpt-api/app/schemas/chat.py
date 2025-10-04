from pydantic import BaseModel
from typing import Optional


class ChatRequestSchema(BaseModel):
    user_input: str
    conversation_id: Optional[int] = None