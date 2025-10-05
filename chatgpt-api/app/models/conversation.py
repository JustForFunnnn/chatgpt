from sqlalchemy import (
    Column,
    Integer,
    String,
)
from sqlalchemy.orm import relationship

from app.models.base import Base, PKMixin, TimestampsMixin
from app.models.message import Message


class Conversation(PKMixin, TimestampsMixin, Base):
    __tablename__ = "conversation"

    title = Column(String, nullable=False)
    user_id = Column(Integer, nullable=False, index=True)

    messages = relationship(
        "Message",
        primaryjoin="Message.conversation_id == Conversation.id",
        order_by="Message.created_at.asc()",
        foreign_keys=lambda: [Message.conversation_id],
        back_populates="conversation",
    )
