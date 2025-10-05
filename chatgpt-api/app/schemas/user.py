from pydantic import BaseModel, Field


class UserCreateSchema(BaseModel):
    username: str = Field(..., min_length=3, max_length=20, description="user name")
    password: str = Field(..., min_length=6, max_length=40, description="password")


class UserSchema(BaseModel):
    id: int
    username: str

    class Config:
        from_attributes = True
