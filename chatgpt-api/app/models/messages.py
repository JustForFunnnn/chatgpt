from base import Base, PKMixin, TimestampsMixin
from sqlalchemy import (
    Column,
    Integer,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql.sqltypes import Enum as SQLEnum

from app.core.enums import MessageRole


class Messages(PKMixin, TimestampsMixin, Base):
    __tablename__ = "messages"

    conversation_id = Column(Integer, nullable=False, index=True)
    role = Column(SQLEnum(MessageRole), nullable=False)
    content = Column(Text, nullable=False)

    conversation = relationship(
        "Conversations",
        primaryjoin="Messages.conversation_id == Conversations.id",
        foreign_keys=[conversation_id],
        back_populates="messages",
    )
