from functools import lru_cache
from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.azure import AzureProvider
from app.core.config import settings

def new_agent() -> Agent:
    model = OpenAIChatModel(
        settings.AI_MODEL_NAME,
        provider=AzureProvider(
            azure_endpoint=settings.AZURE_ENDPOINT,
            api_version=settings.AZURE_API_VERSION,
            api_key=settings.AZURE_API_KEY.get_secret_value(),
        ),
    )
    
    agent = Agent(model=model)
    return agent

__agent = new_agent()

def get_agent() -> Agent:
    return __agent