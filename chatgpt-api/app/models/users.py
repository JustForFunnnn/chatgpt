from sqlalchemy import (
    Column,
    String,
)

from app.models.base import Base, PKMixin, TimestampsMixin


class Users(PKMixin, TimestampsMixin, Base):
    __tablename__ = "users"

    user_name = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
