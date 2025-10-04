from sqlalchemy import (
    Column,
    String,
)

from app.models.base import Base, PKMixin, TimestampsMixin


class Users(PKMixin, TimestampsMixin, Base):
    __tablename__ = "users"

    user_name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
