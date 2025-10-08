import jwt
from jwt import PyJWTError
from passlib.context import CryptContext
from pydantic import ValidationError

from app.core.config import settings
from app.core.constants import ALGORITHM
from app.exceptions.http_exceptions import InvalidCredentialsException
from app.models import User
from app.schemas import JwtTokenPayloadSchema

pwd_context = CryptContext(schemes=["scrypt"], deprecated="auto")


def create_access_token(user: User) -> str:
    """
    Generates a new JWT access token.
    """
    payload_to_encode = JwtTokenPayloadSchema(sub=str(user.id), username=user.username)

    encoded_jwt = jwt.encode(payload_to_encode.model_dump(), settings.JWT_SECRET_KEY.get_secret_value(), algorithm=ALGORITHM)
    return encoded_jwt


def decode_jwt(token: str) -> JwtTokenPayloadSchema:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY.get_secret_value(), algorithms=[ALGORITHM])
        return JwtTokenPayloadSchema(**payload)
    except (PyJWTError, ValidationError):
        raise InvalidCredentialsException()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)
