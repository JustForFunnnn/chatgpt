import logging
from functools import lru_cache

from openai import AsyncAzureOpenAI, AsyncOpenAI
from pydantic_ai import Agent, Tool
from pydantic_ai.models.fallback import FallbackModel
from pydantic_ai.models.google import GoogleModel
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.google import GoogleProvider
from pydantic_ai.providers.openai import OpenAIProvider

from app.core.config import settings
from app.llm.tools import duckduckgo_search, scrape_website

logger = logging.getLogger("app")

SYSTEM_PROMPT = """You are a precise and helpful assistant. Your goal is to provide accurate, safe, and well-formatted answers.

General Rules:
1. Markdown First: Structure responses with headings, task list, numbered list, tables, emoji, and fenced code blocks, alway include the language tags (eg: ```python).
2. Fact-Based: Do not invent facts or APIs. If information is missing, state exactly what is needed. Do not reveal chain-of-thought; provide brief reasoning summaries only if asked.
3. Safety & Privacy: Do not include sensitive data, secrets, or credentials in examples. Use placeholders like `YOUR_API_KEY`. Do not access login-gated or paywalled content.
4. Structured Output Priority: When a structured `output_model` is requested, return only the fields required by the schema and nothing else. This overrides Markdown formatting.

Tool Use Rules:
1.  **When to Search**: `duckduckgo_search` is your **PRIMARY TOOL** for questions about **current events, real-time information, or the latest news**. Use it whenever information might be time-sensitive.
2.  **How to Get Details**: The `snippet` from a search result of `duckduckgo_search` is only a preview. After you identify promising URLs from the search, **you can call `scrape_website(url)`** to retrieve the full, detailed content.
3.  **MANDATORY CITATION**: If `duckduckgo_search` is used, you **MUST ALWAYS cite your sources**. This includes two parts:
    * Add inline numeric citations like `[1]`, `[2]` after the claims they support.
    * Provide a `**DuckDuckGo Search Sources**` section at the end of your answer with full Markdown links (e.g., `[Source Title](https://example.com)`).
"""


def gen_fallback_models() -> FallbackModel:
    models = []

    if settings.AZUREAI_MODEL_NAME and settings.AZUREAI_API_KEY and settings.AZUREAI_ENDPOINT:
        client = AsyncAzureOpenAI(
            azure_endpoint=settings.AZUREAI_ENDPOINT,
            api_version=settings.AZURE_API_VERSION,
            api_key=settings.AZUREAI_API_KEY.get_secret_value(),
        )

        models.append(
            OpenAIChatModel(
                settings.AZUREAI_MODEL_NAME,
                provider=OpenAIProvider(openai_client=client),
            )
        )
        logger.info(f"Added Azure OPENAI model '{settings.AZUREAI_MODEL_NAME}' to agent...")

    if settings.OPENAI_MODEL_NAME and settings.OPENAI_API_KEY:
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY.get_secret_value())
        models.append(OpenAIChatModel(settings.OPENAI_MODEL_NAME, provider=OpenAIProvider(openai_client=client)))
        logger.info(f"Added OpenAI model '{settings.OPENAI_MODEL_NAME}' to agent...")

    if settings.GEMINI_MODEL_NAME and settings.GEMINI_API_KEY:
        models.append(
            GoogleModel(
                settings.GEMINI_MODEL_NAME,
                provider=GoogleProvider(api_key=settings.GEMINI_API_KEY.get_secret_value()),
            )
        )
        logger.info(f"Added Gemini model '{settings.GEMINI_MODEL_NAME}' to agent...")

    if not models:
        raise ValueError("Can not initial any AI model")

    return FallbackModel(*models)


def new_agent() -> Agent:
    fallback_models = gen_fallback_models()
    agent = Agent(
        model=fallback_models,
        system_prompt=SYSTEM_PROMPT,
        tools=[
            Tool(duckduckgo_search, takes_ctx=False),
            Tool(scrape_website, takes_ctx=False),
        ],
    )
    return agent


@lru_cache(maxsize=1)
def get_agent() -> Agent:
    return new_agent()
