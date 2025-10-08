import pytest
import jwt

from app.services.security import create_access_token, decode_jwt, verify_password, get_password_hash
from app.models import User
from app.exceptions.http_exceptions import InvalidCredentialsException
from app.core.config import settings
from app.core.constants import ALGORITHM


class TestSecurityService:
    """Test security service functions"""

    def test_password_hashing(self):
        """Test password hashing and verification"""
        password = "testpassword123"
        hashed = get_password_hash(password)

        assert hashed != password
        assert verify_password(password, hashed)
        assert not verify_password("wrongpassword", hashed)

    def test_create_access_token(self, test_user: User):
        """Test JWT token creation"""
        token = create_access_token(test_user)

        assert isinstance(token, str)
        assert len(token) > 0

        payload = jwt.decode(token, settings.JWT_SECRET_KEY.get_secret_value(), algorithms=[ALGORITHM])
        assert payload["sub"] == str(test_user.id)
        assert payload["username"] == test_user.username

    def test_decode_jwt_valid(self, test_user: User):
        """Test decoding valid JWT"""
        token = create_access_token(test_user)
        payload = decode_jwt(token)

        assert payload.sub == str(test_user.id)
        assert payload.username == test_user.username

    def test_decode_jwt_invalid(self):
        """Test decoding invalid JWT"""
        with pytest.raises(InvalidCredentialsException):
            decode_jwt("invalid.token.here")
