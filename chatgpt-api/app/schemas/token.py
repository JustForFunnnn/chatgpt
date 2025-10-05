from datetime import datetime

from pydantic import BaseModel


class JwtTokenPayloadSchema(BaseModel):
    sub: str  # user id
    username: str
    exp: datetime  # experied date


class TokenSchema(BaseModel):
    access_token: str
    token_type: str = "bearer"
