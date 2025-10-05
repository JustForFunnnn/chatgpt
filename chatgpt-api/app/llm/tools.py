import logging

from duckduckgo_search import DDGS
from pydantic import Field

logger = logging.getLogger("app")


async def duckduckgo_search(query: str = Field(..., description="The search query to find information on the internet.")) -> str:
    """
    Uses DuckDuckGo to search the internet for a given query.
    This tool is perfect for finding real-time information, news, or any topic not covered by the LLM's internal knowledge.
    """
    logger.info(f"Tool 'duckduckgo_search' called with query: {query}")

    try:
        async with DDGS() as ddgs:
            results = [r async for r in ddgs.text(query, max_results=5)]

        if not results:
            return f"No results were found for the query '{query}'. "

        formatted_items = []
        for i, res in enumerate(results, 1):
            formatted_items.append(f"[{i}] Title: {res['title']}\nSnippet: {res['body']}\nURL: {res['href']}\n")

        return formatted_items
    except Exception as e:
        logger.error(f"An error occurred during DuckDuckGo search for query '{query}': {e}", exc_info=True)
        return "An unexpected error occurred while trying to search the internet. " "Please inform the user that the search tool is temporarily unavailable."
