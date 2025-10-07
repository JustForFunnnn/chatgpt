from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from app.exceptions.http_exceptions import UserNotFoundException
from app.models import User
from app.services.security import decode_jwt
from app.core.constants import OAUTH_LOGIN_API

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=OAUTH_LOGIN_API)


async def create_user(session: AsyncSession, username: str, hashed_password: str) -> User | None:
    new_user = User(username=username, hashed_password=hashed_password)
    session.add(new_user)
    await session.flush()
    return new_user


async def get_user_by_name(session: AsyncSession, username: str) -> User | None:
    query = select(User).where(User.username == username)
    result = await session.execute(query)
    return result.scalar_one_or_none()


async def get_current_user(token: str = Depends(oauth2_scheme), session: AsyncSession = Depends(get_session)) -> User:
    payload = decode_jwt(token)

    query = select(User).where(User.id == int(payload.sub))
    result = await session.execute(query)
    user = result.scalar_one_or_none()

    if user is None:
        raise UserNotFoundException()

    return user
