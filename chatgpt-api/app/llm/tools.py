import asyncio
import io
import logging
import re
from typing import List

import httpx
from ddgs import DDGS
from markitdown import MarkItDown
from pydantic import BaseModel
from pydantic_ai import Agent

from app.schemas.chat import GeneratedTitleOutputSchema

logger = logging.getLogger("app")

_remove_md_link_pattern = re.compile(r"(?<!\!)\[([^\]]*)\]\(((?:\([^()]*\)|[^()])*)\)")


class DuckDuckGoResult(BaseModel):
    """A DuckDuckGo search result."""

    title: str
    url: str
    snippet: str


def clean_markdown_content(raw: str) -> str:
    """Clean up the raw markdown content"""

    # Keep link text and drop the URL.
    # This shortens the result and makes the information more readable.
    # e.g.:
    #   accepts [deposits](https://en.wikipedia.org/wiki/Deposit_account) from the public
    #   -> accepts deposits from the public
    text = re.sub(_remove_md_link_pattern, r"\1", raw)
    text = re.sub(r"\s+", " ", text).strip()
    return text


async def suggest_title(agent: Agent, user_query: str) -> str:
    res = await agent.run(f"Suggest a short, concise title for the following user query: '{user_query}'", output_type=GeneratedTitleOutputSchema)
    return res.output.title


async def scrape_website(url: str) -> str:
    """
    Fetches the full content of a specific webpage and return cleaned plaintext of the main content.
    """
    logger.info(f"Tool 'scrape_website' called with url: {url}")
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=3) as client:
            resp = await client.get(
                url,
                headers={"User-Agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) " "AppleWebKit/537.36 (KHTML, like Gecko) " "Chrome/117.0.0.0 Safari/537.36")},
            )
        resp.raise_for_status()
        resp_content = io.BytesIO(resp.content)
        # Convert the web content to markdown text, make it more understandable to LLM
        raw = MarkItDown().convert(resp_content).text_content

        text = clean_markdown_content(raw)
        return text[:5000]
    except Exception as e:
        logger.error(f"Tool 'scrape_website' error: {e}", exc_info=True)
        return ""


async def duckduckgo_search(query: str) -> List[DuckDuckGoResult]:
    """
    Web search for fresh or verifiable facts.
    Call when time-sensitive, niche, or uncertain.

    **MANDATORY COMPLIANCE:**
    - If this tool is used, the final answer **MUST** include both inline numeric citations `[n]` and a final `**DuckDuckGo Search Sources**` section with Markdown links (e.g., `[Source Title](https://example.com)`).
    - Prefer primary/official sources when available.
    - Call this tool at most 2 times per user query.

    Examples query that can use this tool:
    - 'OpenAI board changes timeline this week'
    - 'What is the current AI news'
    - 'What is the weather of GuangDong today'
    """
    logger.info(f"Tool 'duckduckgo_search' called with query: {query}")

    try:
        def _search():
            with DDGS(timeout=3) as ddgs_obj:
                return list(ddgs_obj.text(query, max_results=10))

        resp = await asyncio.to_thread(_search)
    except Exception as e:
        logger.error(f"Tool 'duckduckgo_search' error: {e}", exc_info=True)
        return []

    if not resp:
        return []

    results: List[DuckDuckGoResult] = []
    for item in resp or []:
        results.append(
            DuckDuckGoResult(
                title=item.get("title", ""),
                snippet=item.get("body", ""),
                url=item.get("href", ""),
            )
        )
    return results
