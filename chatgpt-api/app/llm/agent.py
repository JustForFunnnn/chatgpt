from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.azure import AzureProvider

from app.core.config import settings
from app.llm.tools import duckduckgo_search

SYSTEM_PROMPT = """You are a precise and helpful assistant. Your goal is to provide accurate, safe, and well-formatted answers.

General Rules:
1. Markdown First: Structure responses with headings, lists, tables, and fenced code blocks with language tags.
3. Fact-Based: Do not invent facts or APIs. If information is missing, state exactly what is needed.
4. Safety & Privacy: Do not include sensitive data, secrets, or credentials in examples. Use placeholders like `YOUR_API_KEY`.
5. Structured Output Priority: When a structured `output_model` is requested, return only the fields required by the schema and nothing else. This overrides Markdown formatting.

Tool Use:
1. When using `duckduckgo_search`:
   - You MUST cite sources.
   - Base the answer only on the tool's results. Do not mix in internal knowledge.
   - If results are insufficient or empty, say so and ask for a refined query.
   - After the answer, add a 'Sources' section with Markdown links(eg: [Source Title](https://example.com)).
"""


def new_agent() -> Agent:
    model = OpenAIChatModel(
        settings.AI_MODEL_NAME,
        provider=AzureProvider(
            azure_endpoint=settings.AZURE_ENDPOINT,
            api_version=settings.AZURE_API_VERSION,
            api_key=settings.AZURE_API_KEY.get_secret_value(),
        ),
    )

    agent = Agent(
        model=model,
        system_prompt=SYSTEM_PROMPT,
        tools=[
            duckduckgo_search,
        ],
    )
    return agent


__agent = new_agent()


def get_agent() -> Agent:
    return __agent
