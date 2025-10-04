# model.py
from sqlalchemy import (
    Column,
    String,
)
from base import PKMixin, TimestampsMixin, Base


class Users(PKMixin, TimestampsMixin, Base):
    __tablename__ = "users"
    
    user_name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
