from unittest.mock import patch, MagicMock

from app.llm.agent import gen_fallback_models
from pydantic_ai.models.openai import OpenAIChatModel


class TestLLMAgent:
    """Test LLM agent initialization"""

    @patch("app.llm.agent.settings")
    def test_gen_fallback_models_openai(self, mock_settings):
        """Test fallback models with OpenAI config"""
        mock_settings.OPENAI_MODEL_NAME = "gpt-4"
        mock_settings.OPENAI_API_KEY = MagicMock()
        mock_settings.OPENAI_API_KEY.get_secret_value.return_value = "test-key"
        mock_settings.GEMINI_MODEL_NAME = None
        mock_settings.AZUREAI_MODEL_NAME = None

        fallback_models = gen_fallback_models()

        assert len(fallback_models.models) == 1
        assert type(fallback_models.models[0]) is OpenAIChatModel
