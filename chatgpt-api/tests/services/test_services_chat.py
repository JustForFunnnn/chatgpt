import pytest
from pydantic_ai import ModelRequest, ModelResponse, TextPart, UserPromptPart
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import MessageRole, SSEventType
from app.models import Conversation, Message, User
from app.services.chat import SSEvent, create_conversation, create_message, get_user_conversation_with_messages, list_user_conversations, messages_to_model_messages, trim_message_history


class TestChatService:
    """Test chat service functions"""

    @pytest.mark.asyncio
    async def test_create_conversation(self, test_session: AsyncSession, test_user: User):
        """Test creating a conversation"""
        conv = await create_conversation(test_session, "Test Title", test_user.id)

        assert conv is not None
        assert conv.title == "Test Title"
        assert conv.user_id == test_user.id
        assert conv.id is not None

    @pytest.mark.asyncio
    async def test_create_message(self, test_session: AsyncSession, test_user: User, test_conversation: Conversation):
        """Test creating a message"""
        msg = await create_message(test_session, test_conversation.id, test_user.id, MessageRole.USER, "Test message")

        assert msg is not None
        assert msg.conversation_id == test_conversation.id
        assert msg.user_id == test_user.id
        assert msg.role == MessageRole.USER
        assert msg.content == "Test message"

    @pytest.mark.asyncio
    async def test_get_user_conversation_with_messages(self, test_session: AsyncSession, test_user: User, test_conversation: Conversation, test_messages: list[Message]):
        """Test getting conversation with messages"""
        conv = await get_user_conversation_with_messages(test_session, test_conversation.id, test_user.id)

        assert conv is not None
        assert conv.id == test_conversation.id
        assert len(conv.messages) == len(test_messages)

    @pytest.mark.asyncio
    async def test_list_user_conversations(self, test_session: AsyncSession, test_user: User, test_conversation: Conversation):
        """Test listing user conversations"""
        convs = await list_user_conversations(test_session, test_user.id)

        assert len(convs) == 1
        assert any(c.id == test_conversation.id for c in convs)

    def test_messages_to_model_messages(self, test_messages: list[Message]):
        """Test converting messages to model messages"""
        model_msgs = messages_to_model_messages(test_messages)

        assert len(model_msgs) == len(test_messages)
        assert isinstance(model_msgs[0], ModelRequest)
        assert isinstance(model_msgs[1], ModelResponse)

    def test_trim_message_history_no_trim_needed(self):
        """Test trim when under limit"""
        msgs = [ModelRequest(parts=[UserPromptPart(content="Short")]), ModelResponse(parts=[TextPart(content="Reply")])]

        trimmed = trim_message_history(msgs, max_chars=1000, pin_heads=1)

        assert len(trimmed) == len(msgs)

    def test_trim_message_history_with_trim(self):
        """Test trim when over limit"""
        msgs = [
            ModelRequest(parts=[UserPromptPart(content="A" * 100)]),
            ModelRequest(parts=[UserPromptPart(content="B" * 100)]),
            ModelRequest(parts=[UserPromptPart(content="C" * 100)]),
        ]

        trimmed = trim_message_history(msgs, max_chars=150, pin_heads=1)

        assert len(trimmed) < len(msgs)
        assert trimmed[0] == msgs[0]

    def test_ss_event_serialization(self):
        """Test SSEvent serialization"""
        event = SSEvent(SSEventType.DELTA, "test data")
        serialized = str(event)

        assert "event: delta" in serialized
        assert "data: " in serialized
        assert "test data" in serialized
