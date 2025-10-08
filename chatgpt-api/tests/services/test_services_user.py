import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User
from app.services.user import create_user, get_user_by_name
from app.services.security import get_password_hash


class TestUserService:
    """Test user service functions"""

    @pytest.mark.asyncio
    async def test_create_user(self, test_session: AsyncSession):
        """Test creating a new user"""
        hashed_pw = get_password_hash("testpass")
        user = await create_user(test_session, "newuser", hashed_pw)

        assert user is not None
        assert user.username == "newuser"
        assert user.hashed_password == hashed_pw
        assert user.id is not None

    @pytest.mark.asyncio
    async def test_get_user_by_name_exists(self, test_session: AsyncSession, test_user: User):
        """Test getting existing user by name"""
        user = await get_user_by_name(test_session, test_user.username)

        assert user is not None
        assert user.id == test_user.id
        assert user.username == test_user.username

    @pytest.mark.asyncio
    async def test_get_user_by_name_not_exists(self, test_session: AsyncSession):
        """Test getting nonexistent user by name"""
        user = await get_user_by_name(test_session, "nonexistent")

        assert user is None
