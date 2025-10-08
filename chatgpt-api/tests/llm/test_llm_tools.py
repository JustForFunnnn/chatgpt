import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from pydantic_ai import Agent

from app.llm.tools import duckduckgo_search, scrape_website, suggest_title, clean_markdown_content, DuckDuckGoResult


class TestLLMTools:
    """Test LLM tool functions"""

    @pytest.mark.asyncio
    async def test_suggest_title(self):
        """Test title suggestion"""
        mock_agent = AsyncMock(spec=Agent)
        mock_result = MagicMock()
        mock_result.output.title = "Suggested Title"
        mock_agent.run.return_value = mock_result

        title = await suggest_title(mock_agent, "What is AI?")

        assert title == "Suggested Title"
        mock_agent.run.assert_called_once()

    @pytest.mark.asyncio
    @patch("app.llm.tools.DDGS")
    async def test_duckduckgo_search_success(self, mock_ddgs):
        """Test successful DuckDuckGo search"""
        mock_instance = MagicMock()
        mock_instance.text.return_value = [{"title": "Test Result", "body": "Test snippet", "href": "https://example.com"}]
        mock_ddgs.return_value.__enter__.return_value = mock_instance

        results = await duckduckgo_search("test query")

        assert len(results) == 1
        assert isinstance(results[0], DuckDuckGoResult)
        assert results[0].title == "Test Result"
        assert results[0].snippet == "Test snippet"
        assert results[0].url == "https://example.com"

    @pytest.mark.asyncio
    @patch("app.llm.tools.DDGS")
    async def test_duckduckgo_search_error(self, mock_ddgs):
        """Test DuckDuckGo search with error"""
        mock_ddgs.return_value.__enter__.side_effect = Exception("Search failed")

        results = await duckduckgo_search("test query")

        assert results == []

    @pytest.mark.asyncio
    @patch("app.llm.tools.httpx.AsyncClient")
    @patch("app.llm.tools.MarkItDown")
    async def test_scrape_website_success(self, mock_markitdown, mock_client):
        """Test successful website scraping"""
        mock_response = MagicMock()
        mock_response.content = b"Test content"
        mock_response.raise_for_status = MagicMock()

        mock_client_instance = AsyncMock()
        mock_client_instance.get.return_value = mock_response
        mock_client.return_value.__aenter__.return_value = mock_client_instance

        mock_md_instance = MagicMock()
        mock_md_result = MagicMock()
        mock_md_result.text_content = "Converted markdown content"
        mock_md_instance.convert.return_value = mock_md_result
        mock_markitdown.return_value = mock_md_instance

        result = await scrape_website("https://example.com")

        assert isinstance(result, str)
        assert "Converted markdown content" in result

    @pytest.mark.asyncio
    @patch("app.llm.tools.httpx.AsyncClient")
    async def test_scrape_website_error(self, mock_client):
        """Test website scraping with error"""
        mock_client_instance = AsyncMock()
        mock_client_instance.get.side_effect = Exception("Request failed")
        mock_client.return_value.__aenter__.return_value = mock_client_instance

        result = await scrape_website("https://example.com")

        assert result == ""

    def test_clean_markdown_content(self):
        """Test markdown content cleaning"""
        raw = "Text with [link](https://example.com) and  multiple   spaces"
        cleaned = clean_markdown_content(raw)

        assert "[link]" not in cleaned
        assert "link" in cleaned
        assert "  " not in cleaned
