from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import ACCESS_TOKEN_AUTH_TYPE
from app.db import get_session
from app.exceptions.http_exceptions import DuplicatedUserNameException, InvalidCredentialsException
from app.models import User
from app.schemas import TokenSchema
from app.schemas.user import UserCreateSchema, UserSchema
from app.services.security import (
    create_access_token,
    get_password_hash,
    verify_password,
)
from app.services.user import create_user, get_current_user, get_user_by_name

router = APIRouter()


@router.post("/register", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_in: UserCreateSchema,
    session: AsyncSession = Depends(get_session),
):
    existing_user = await get_user_by_name(session, user_in.username)
    if existing_user:
        raise DuplicatedUserNameException()

    hashed_password = get_password_hash(user_in.password)
    new_user = await create_user(session, user_in.username, hashed_password)

    return new_user


@router.post("/login", response_model=TokenSchema)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: AsyncSession = Depends(get_session),
):
    user = await get_user_by_name(session, form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise InvalidCredentialsException()

    access_token = create_access_token(user)
    return {"access_token": access_token, "token_type": ACCESS_TOKEN_AUTH_TYPE}


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """Do nothing, the client should delete the jwt token from storage after call this api"""
    return {"message": f"User {current_user.id} has been logged out successfully."}
