from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from app.exceptions.http_exceptions import DuplicatedUserNameException, InvalidCredentialsException
from app.models import Users
from app.schemas.token import TokenSchema
from app.schemas.user import UserCreateSchema, UserSchema
from app.services.auth import (
    create_access_token,
    get_current_user,
    get_password_hash,
    get_user_by_username,
    verify_password,
)

router = APIRouter()


@router.post("/register", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_in: UserCreateSchema,
    session: AsyncSession = Depends(get_session),
):
    existing_user = await get_user_by_username(session, user_in.user_name)
    if existing_user:
        raise DuplicatedUserNameException()

    hashed_password = get_password_hash(user_in.password)
    new_user = Users(user_name=user_in.user_name, hashed_password=hashed_password)
    session.add(new_user)
    await session.flush()

    return new_user


@router.post("/login", response_model=TokenSchema)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: AsyncSession = Depends(get_session),
):
    user = await get_user_by_username(session, form_data.username)
    if not user or not verify_password(form_data.password, user.password_hash):
        raise InvalidCredentialsException()

    access_token = create_access_token(user)
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/logout")
async def logout(current_user: Users = Depends(get_current_user)):
    return {"message": f"User {current_user.user_name} has been logged out successfully."}
