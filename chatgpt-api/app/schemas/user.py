from pydantic import BaseModel, Field


class UserBaseSchema(BaseModel):
    user_name: str = Field(..., min_length=3, max_length=20, description="user name")


class UserCreateSchema(UserBaseSchema):
    password: str = Field(..., min_length=6, description="password")


class UserSchema(UserBaseSchema):
    id: int

    class Config:
        from_attributes = True
