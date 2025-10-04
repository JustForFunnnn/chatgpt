from base import Base, PKMixin, TimestampsMixin
from sqlalchemy import (
    Column,
    String,
)


class Users(PKMixin, TimestampsMixin, Base):
    __tablename__ = "users"

    user_name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
