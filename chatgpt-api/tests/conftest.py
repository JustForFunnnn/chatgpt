import pytest
import asyncio
from typing import AsyncGenerator, Generator
from unittest.mock import AsyncMock, MagicMock

from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool
from pydantic_ai import Agent

from app.main import app as fastapi_app
from app.models import Base, User, Conversation, Message
from app.db import get_session
from app.llm import get_agent
from app.services.security import create_access_token, get_password_hash
from app.core.enums import MessageRole


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Creates a shared event loop for the entire test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def test_engine():
    """
    shared across the test session. Table schema is created only once.
    """
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    await engine.dispose()


@pytest.fixture(scope="function")
async def test_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """
    Provides an isolated database session and transaction for each test function.
    Data is cleared after each test.
    """
    async_session_factory = async_sessionmaker(test_engine, expire_on_commit=False, class_=AsyncSession)

    async with async_session_factory() as session:
        yield session
        # Clear all table data to ensure test isolation
        for table in reversed(Base.metadata.sorted_tables):
            await session.execute(table.delete())
        await session.commit()


@pytest.fixture(scope="function")
def override_get_session(test_session: AsyncSession):
    """Overrides the `get_session` dependency in the FastAPI app to use our `test_session`."""

    async def _override_get_session():
        yield test_session

    fastapi_app.dependency_overrides[get_session] = _override_get_session
    yield
    fastapi_app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def mock_agent():
    """Mocks the LLM Agent to return a predictable, streaming response."""
    agent_mock = MagicMock(spec=Agent)

    mock_result = MagicMock()

    async def stream_text_gen(*args, **kwargs):
        yield "Mocked "
        yield "stream "
        yield "response."

    mock_result.stream_text.return_value = stream_text_gen()

    async def async_context_manager(*args, **kwargs):
        return mock_result

    agent_mock.run_stream.return_value = AsyncMock(__aenter__=async_context_manager)
    agent_mock.run = AsyncMock()

    fastapi_app.dependency_overrides[get_agent] = lambda: agent_mock
    yield agent_mock
    fastapi_app.dependency_overrides.clear()


@pytest.fixture(scope="function")
async def async_client(override_get_session) -> AsyncGenerator[AsyncClient, None]:
    """Creates an async client that can be used to make API calls."""
    transport = ASGITransport(app=fastapi_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


# Table Records Fixture


@pytest.fixture(scope="function")
async def test_user(test_session: AsyncSession) -> User:
    user = User(username="testuser", hashed_password=get_password_hash("testpass123"))
    test_session.add(user)
    await test_session.commit()
    await test_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def auth_token(test_user: User) -> str:
    return create_access_token(test_user)


@pytest.fixture(scope="function")
def auth_headers(auth_token: str) -> dict:
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture(scope="function")
async def test_conversation(test_session: AsyncSession, test_user: User) -> Conversation:
    conversation = Conversation(title="Test Conversation", user_id=test_user.id)
    test_session.add(conversation)
    await test_session.commit()
    await test_session.refresh(conversation)
    return conversation


@pytest.fixture(scope="function")
async def test_messages(test_session: AsyncSession, test_user: User, test_conversation: Conversation) -> list[Message]:
    messages = [Message(user_id=test_user.id, conversation_id=test_conversation.id, role=MessageRole.USER, content="Hello"), Message(user_id=test_user.id, conversation_id=test_conversation.id, role=MessageRole.ASSISTANT, content="Hi there!")]
    test_session.add_all(messages)
    await test_session.commit()
    for msg in messages:
        await test_session.refresh(msg)
    return messages
