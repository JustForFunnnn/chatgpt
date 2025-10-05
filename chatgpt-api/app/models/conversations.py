from sqlalchemy import (
    Column,
    Integer,
    String,
)
from sqlalchemy.orm import relationship

from app.models.base import Base, PKMixin, TimestampsMixin
from app.models.messages import Messages


class Conversations(PKMixin, TimestampsMixin, Base):
    __tablename__ = "conversations"

    title = Column(String, nullable=False)
    user_id = Column(Integer, nullable=False, index=True)

    messages = relationship(
        "Messages",
        primaryjoin="Messages.conversation_id == Conversations.id",
        foreign_keys=lambda: [Messages.conversation_id],
        back_populates="conversation",
    )
