import logging
from typing import AsyncGenerator

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.exceptions.app import DatabaseError

logger = logging.getLogger("app")

async_engine = create_async_engine(settings.DATABASE_URL.get_secret_value(), echo=False)
async_session_factory = async_sessionmaker(async_engine, expire_on_commit=False)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except SQLAlchemyError as e:
            logger.error(f"Database transaction failed: {e}", exc_info=True)
            await session.rollback()
            raise DatabaseError(detail="A database error occurred during the transaction.")
        except Exception as exc:
            logger.error(f"An unexpected error occurred during the session, rolling back: {exc}", exc_info=True)
            await session.rollback()
            raise
