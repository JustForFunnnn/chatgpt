from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class JwtTokenPayloadSchema(BaseModel):
    sub: str  # user id
    username: str
    exp: datetime


class TokenSchema(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserCreateSchema(BaseModel):
    username: str = Field(..., min_length=3, max_length=20, description="user name")
    password: str = Field(..., min_length=6, max_length=40, description="password")


class UserSchema(BaseModel):
    id: int
    username: str

    model_config = ConfigDict(from_attributes=True)
