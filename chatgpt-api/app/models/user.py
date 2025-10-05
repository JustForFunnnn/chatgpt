from sqlalchemy import (
    Column,
    String,
)

from app.models.base import Base, PKMixin, TimestampsMixin


class User(PKMixin, TimestampsMixin, Base):
    __tablename__ = "user"

    username = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
