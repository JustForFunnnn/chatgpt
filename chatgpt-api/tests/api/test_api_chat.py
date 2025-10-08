from unittest.mock import MagicMock

import pytest
from httpx import AsyncClient

from app.models import Conversation


class TestChatEndpoint:
    @pytest.mark.asyncio
    async def test_chat_new_conversation(self, async_client: AsyncClient, auth_headers: dict, mock_agent):
        """Test starting a new chat conversation"""
        mock_title_result = MagicMock()
        mock_title_result.output.title = "Test Chat"
        mock_agent.run.return_value = mock_title_result

        response = await async_client.post("/api/v1/chat", headers=auth_headers, json={"user_input": "Hello"})

        assert response.status_code == 200
        assert "X-Conversation-Id" in response.headers
        assert int(response.headers["X-Conversation-Id"]) > 0
        assert response.headers["content-type"] == "text/event-stream; charset=utf-8"

        streamed_text = await response.aread()

        expected_output = 'event: delta\ndata: "Mocked "\n\n' 'event: delta\ndata: "stream "\n\n' 'event: delta\ndata: "response."\n\n' "event: done\ndata: null\n\n"

        assert streamed_text.decode() == expected_output

    @pytest.mark.asyncio
    async def test_chat_existing_conversation(self, async_client: AsyncClient, auth_headers: dict, test_conversation: Conversation, test_messages: list, mock_agent):
        """Test continuing an existing conversation"""

        response = await async_client.post("/api/v1/chat", headers=auth_headers, json={"user_input": "Continue chat", "conversation_id": test_conversation.id})

        assert response.status_code == 200
        assert response.headers["X-Conversation-Id"] == str(test_conversation.id)

    @pytest.mark.asyncio
    async def test_chat_invalid_conversation_id(self, async_client: AsyncClient, auth_headers: dict):
        """Test chat with invalid conversation ID"""
        response = await async_client.post("/api/v1/chat", headers=auth_headers, json={"user_input": "Hello", "conversation_id": 99999})

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_chat_without_auth(self, async_client: AsyncClient):
        """Test chat without authentication"""
        response = await async_client.post("/api/v1/chat", json={"user_input": "Hello"})

        assert response.status_code == 401
