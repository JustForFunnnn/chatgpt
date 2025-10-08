import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User


class TestUserRegistration:
    """Test user registration endpoint"""

    @pytest.mark.asyncio
    async def test_register_success(self, async_client: AsyncClient, test_session: AsyncSession):
        """Test successful user registration"""
        response = await async_client.post("/api/v1/register", json={"username": "newuser", "password": "password123"})

        assert response.status_code == 201
        data = response.json()
        assert data["username"] == "newuser"
        assert "id" in data
        assert "hashed_password" not in data

    @pytest.mark.asyncio
    async def test_register_duplicate_username(self, async_client: AsyncClient, test_user: User):
        """Test registration with duplicate username"""
        response = await async_client.post("/api/v1/register", json={"username": test_user.username, "password": "password123"})

        assert response.status_code == 400
        data = response.json()
        assert data["error_code"] == "DUPLICATED_USER_NAME"

    @pytest.mark.asyncio
    async def test_register_invalid_username_too_short(self, async_client: AsyncClient):
        """Test registration with too short username"""
        response = await async_client.post("/api/v1/register", json={"username": "ab", "password": "password123"})

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_register_invalid_password_too_short(self, async_client: AsyncClient):
        """Test registration with too short password"""
        response = await async_client.post("/api/v1/register", json={"username": "newuser", "password": "12345"})

        assert response.status_code == 422


class TestUserLogin:
    """Test user login endpoint"""

    @pytest.mark.asyncio
    async def test_login_success(self, async_client: AsyncClient, test_user: User):
        """Test successful login"""
        response = await async_client.post("/api/v1/login", data={"username": "testuser", "password": "testpass123"})

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, async_client: AsyncClient, test_user: User):
        """Test login with wrong password"""
        response = await async_client.post("/api/v1/login", data={"username": "testuser", "password": "wrongpassword"})

        assert response.status_code == 401
        data = response.json()
        assert data["error_code"] == "INVALID_CREDENTIALS"

    @pytest.mark.asyncio
    async def test_login_nonexistent_user(self, async_client: AsyncClient):
        """Test login with nonexistent user"""
        response = await async_client.post("/api/v1/login", data={"username": "nonexistent", "password": "password123"})

        assert response.status_code == 401
        data = response.json()
        assert data["error_code"] == "INVALID_CREDENTIALS"


class TestUserLogout:
    """Test user logout endpoint"""

    @pytest.mark.asyncio
    async def test_logout_success(self, async_client: AsyncClient, auth_headers: dict):
        """Test successful logout"""
        response = await async_client.post("/api/v1/logout", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert "message" in data

    @pytest.mark.asyncio
    async def test_logout_without_auth(self, async_client: AsyncClient):
        """Test logout without authentication"""
        response = await async_client.post("/api/v1/logout")

        assert response.status_code == 401
