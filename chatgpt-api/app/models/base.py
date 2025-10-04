# model.py
from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


class PKMixin:
    __abstract__ = True
    id = Column(Integer, primary_key=True)


class TimestampsMixin:
    __abstract__ = True
    created_at = Column(DateTime, nullable=False, default=datetime.now)
    updated_at = Column(DateTime, nullable=False, default=datetime.now, onupdate=datetime.now)


class Users(PKMixin, TimestampsMixin, Base):
    __tablename__ = "users"

    user_name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)


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
