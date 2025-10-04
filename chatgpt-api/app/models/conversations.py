from base import Base, PKMixin, TimestampsMixin
from messages import Messages
from sqlalchemy import (
    Column,
    Integer,
    String,
)
from sqlalchemy.orm import relationship


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
