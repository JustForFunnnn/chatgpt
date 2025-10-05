from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from jwt import ExpiredSignatureError, PyJWTError
from passlib.context import CryptContext
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db import get_session
from app.exceptions.http_exceptions import InvalidCredentialsException, TokenExpiredException, UserNotFoundException
from app.models import User
from app.schemas.token import JwtTokenPayloadSchema

SECRET_KEY = settings.PASSWORD_SECRET_KEY.get_secret_value()
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

pwd_context = CryptContext(schemes=["scrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/login")


def create_access_token(user: User, expires_delta: Optional[timedelta] = None) -> str:
    """
    Generates a new JWT access token.
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)

    payload_to_encode = JwtTokenPayloadSchema(sub=str(user.id), username=user.username, exp=expire)

    encoded_jwt = jwt.encode(payload_to_encode.model_dump(), SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


async def get_user_by_name(session: AsyncSession, username: str) -> User | None:
    query = select(User).where(User.username == username)
    result = await session.execute(query)
    return result.scalar_one_or_none()


async def get_current_user(token: str = Depends(oauth2_scheme), session: AsyncSession = Depends(get_session)) -> User:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        token_data = JwtTokenPayloadSchema(**payload)
    except ExpiredSignatureError as exc:
        raise TokenExpiredException()
    except (PyJWTError, ValidationError) as e:
        raise InvalidCredentialsException()

    query = select(User).where(User.id == int(token_data.sub))
    result = await session.execute(query)
    user = result.scalar_one_or_none()

    if user is None:
        raise UserNotFoundException()

    return user
