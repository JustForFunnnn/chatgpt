import pytest
from httpx import AsyncClient

from app.exceptions.http_exceptions import HttpErrorCode
from app.models import Conversation, Message


class TestListConversations:
    """Test list conversations endpoint"""

    @pytest.mark.asyncio
    async def test_list_conversations_success(self, async_client: AsyncClient, auth_headers: dict, test_conversation: Conversation):
        """Test successful conversation listing"""
        response = await async_client.get("/api/v1/conversations", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["id"] == test_conversation.id
        assert data[0]["title"] == test_conversation.title

    @pytest.mark.asyncio
    async def test_list_conversations_without_auth(self, async_client: AsyncClient):
        """Test listing conversations without auth"""
        response = await async_client.get("/api/v1/conversations")

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_list_conversations_empty(self, async_client: AsyncClient, auth_headers: dict):
        """Test listing conversations when user has none"""
        response = await async_client.get("/api/v1/conversations", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestGetConversation:
    """Test get conversation detail endpoint"""

    @pytest.mark.asyncio
    async def test_get_conversation_success(self, async_client: AsyncClient, auth_headers: dict, test_conversation: Conversation, test_messages: list[Message]):
        """Test successful conversation retrieval"""
        response = await async_client.get(f"/api/v1/conversations/{test_conversation.id}", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_conversation.id
        assert data["title"] == test_conversation.title
        assert "messages" in data
        assert len(data["messages"]) == len(test_messages)

    @pytest.mark.asyncio
    async def test_get_conversation_not_found(self, async_client: AsyncClient, auth_headers: dict):
        """Test getting nonexistent conversation"""
        response = await async_client.get("/api/v1/conversations/99999", headers=auth_headers)

        assert response.status_code == 404
        data = response.json()
        assert data["error_code"] == HttpErrorCode.CONVERSATION_NOT_FOUND.value

    @pytest.mark.asyncio
    async def test_get_conversation_without_auth(self, async_client: AsyncClient, test_conversation: Conversation):
        """Test getting conversation without auth"""
        response = await async_client.get(f"/api/v1/conversations/{test_conversation.id}")

        assert response.status_code == 401
