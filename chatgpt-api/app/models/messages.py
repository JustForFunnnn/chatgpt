# model.py
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Text,
    func as sql_func
)
from sqlalchemy.orm import DeclarativeBase, relationship
from base import PKMixin, TimestampsMixin, Base
from messages import Message


class Messages(PKMixin, TimestampsMixin, Base):
    __tablename__ = "messages"

    conversation_id = Column(Integer, nullable=False, index=True)
    role = Column(String, nullable=False)
    content = Column(Text, nullable=False)

    conversation = relationship(
        "Conversations",
        primaryjoin="Messages.conversation_id == Conversations.id",
        foreign_keys=[conversation_id],
        back_populates="messages",
    )