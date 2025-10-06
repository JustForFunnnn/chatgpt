from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from jwt import ExpiredSignatureError, PyJWTError
from passlib.context import CryptContext
from pydantic import ValidationError

from app.core.config import settings
from app.exceptions.http_exceptions import InvalidCredentialsException, TokenExpiredException
from app.models import User
from app.schemas import JwtTokenPayloadSchema

SECRET_KEY = settings.JWT_SECRET_KEY.get_secret_value()
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

pwd_context = CryptContext(schemes=["scrypt"], deprecated="auto")


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


def decode_jwt(token: str) -> JwtTokenPayloadSchema:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return JwtTokenPayloadSchema(**payload)
    except ExpiredSignatureError:
        raise TokenExpiredException()
    except (PyJWTError, ValidationError):
        raise InvalidCredentialsException()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)
