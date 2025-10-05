import logging
from logging.config import dictConfig

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import auth, chat, conversation
from app.core.exception_handlers import register_exception_handlers
from app.core.logging_config import LOGGING_CONFIG

dictConfig(LOGGING_CONFIG)
logger = logging.getLogger("app")

origins = [
    "http://localhost:3000",
]


def config_app(app: FastAPI):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include API router
    app.include_router(chat.router, prefix="/api/v1")
    app.include_router(conversation.router, prefix="/api/v1")
    app.include_router(auth.router, prefix="/api/v1")

    # Register exception handers and print log
    register_exception_handlers(app)


app = FastAPI(title="chatgpt-api")
config_app(app)


@app.get("/")
def read_root():
    return {"message": "Welcome to the Chat API"}
