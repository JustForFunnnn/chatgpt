from typing import Optional

from pydantic import BaseModel


class ChatRequestSchema(BaseModel):
    user_input: str
    conversation_id: Optional[int] = None
