import logging
from logging.config import dictConfig

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import chat, conversation, user
from app.core.config import settings
from app.core.exception_handlers import register_exception_handlers
from app.core.logging_config import LOGGING_CONFIG
from app.core.constants import CONVERSATION_ID_HTTP_HEADER

dictConfig(LOGGING_CONFIG)
logger = logging.getLogger("app")


def config_app(app: FastAPI):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=[CONVERSATION_ID_HTTP_HEADER],
    )

    # Include API router
    app.include_router(chat.router, prefix="/api/v1")
    app.include_router(conversation.router, prefix="/api/v1")
    app.include_router(user.router, prefix="/api/v1")

    # Register exception handers and print log
    register_exception_handlers(app)


app = FastAPI(title="chatgpt-api")
config_app(app)


@app.get("/")
def read_root():
    return {"message": "Welcome to the Chat API"}
