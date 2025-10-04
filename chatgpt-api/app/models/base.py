from datetime import datetime

from sqlalchemy import Column, DateTime, Integer
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


class PKMixin:
    __abstract__ = True
    id = Column(Integer, primary_key=True)


class TimestampsMixin:
    __abstract__ = True
    created_at = Column(DateTime, nullable=False, default=datetime.now)
    updated_at = Column(DateTime, nullable=False, default=datetime.now, onupdate=datetime.now)
