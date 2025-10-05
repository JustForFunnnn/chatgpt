from datetime import datetime

from pydantic import BaseModel


class JwtTokenPayloadSchema(BaseModel):
    sub: int  # user id
    user_name: str
    exp: datetime  # experied date


class TokenSchema(BaseModel):
    access_token: str
    token_type: str = "bearer"
