import logging
from typing import AsyncGenerator

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.exceptions.app_error import DatabaseError

logger = logging.getLogger("app")

async_engine = create_async_engine(settings.DATABASE_URL.get_secret_value(), echo=False)
async_session_factory = async_sessionmaker(async_engine, expire_on_commit=False)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except SQLAlchemyError as e:
            await session.rollback()
            raise DatabaseError(message=f"Database error: {e}")
        except Exception:
            await session.rollback()
            raise
