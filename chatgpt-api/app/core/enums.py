from enum import Enum


class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"


class SSEventType(Enum):
    DELTA = "delta"
    DONE = "done"
    ERROR = "error"
