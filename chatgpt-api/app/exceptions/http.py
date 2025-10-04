from enum import Enum
from fastapi import HTTPException, status

class HttpErrorCode(str, Enum):
    TOKEN_EXPIRED = "TOKEN_EXPIRED"
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS"
    CONVERSATION_NOT_FOUND = "CONVERSATION_NOT_FOUND"


class HttpBaseException(HTTPException):
    def __init__(self, status_code: int, error_code: HttpErrorCode, message: str, headers: dict | None = None):
        detail = {"error_code": error_code.value, "message": message}
        super().__init__(status_code=status_code, detail=detail, headers=headers)


class TokenExpiredException(HttpBaseException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code=HttpErrorCode.TOKEN_EXPIRED,
            message="Token has expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )

class InvalidCredentialsException(HttpBaseException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code=HttpErrorCode.INVALID_CREDENTIALS,
            message="Could not validate credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

class ConversationNotFoundException(HttpBaseException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            error_code=HttpErrorCode.CONVERSATION_NOT_FOUND,
            message="Conversation not found.",
        )

