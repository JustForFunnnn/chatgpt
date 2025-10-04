# model.py
from sqlalchemy import (
    Column,
    Integer,
    String,
)
from sqlalchemy.orm import  relationship
from base import PKMixin, TimestampsMixin, Base
from messages import Messages

class Conversations(PKMixin, TimestampsMixin, Base):
    __tablename__ = "conversations"

    title = Column(String, nullable=False)
    user_id = Column(Integer, nullable=True) 

    messages = relationship(
        "Messages",
        primaryjoin="Messages.conversation_id == Conversations.id",
        foreign_keys=lambda: [Messages.conversation_id],
        back_populates="conversation",
    )
