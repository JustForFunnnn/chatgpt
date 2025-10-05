from enum import Enum

from fastapi import HTTPException, status


class HttpErrorCode(str, Enum):
    TOKEN_EXPIRED = "TOKEN_EXPIRED"
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS"
    DUPLICATED_USER_NAME = "DUPLICATED_USER_NAME"
    CONVERSATION_NOT_FOUND = "CONVERSATION_NOT_FOUND"


class HttpBaseException(HTTPException):
    def __init__(self, status_code: int, error_code: HttpErrorCode, message: str):
        self.error_code = error_code
        self.message = message
        detail = {"error_code": error_code.value, "message": message}
        super().__init__(status_code=status_code, detail=detail)


class TokenExpiredException(HttpBaseException):
    def __init__(self, message: str = "Token has expired."):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code=HttpErrorCode.TOKEN_EXPIRED,
            message=message,
        )


class InvalidCredentialsException(HttpBaseException):
    def __init__(self, message: str = "Could not validate credentials."):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code=HttpErrorCode.INVALID_CREDENTIALS,
            message=message,
        )


class DuplicatedUserNameException(HttpBaseException):
    def __init__(self, message: str = "Duplicated user name."):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code=HttpErrorCode.DUPLICATED_USER_NAME,
            message=message,
        )


class UserNotFoundException(HttpBaseException):
    def __init__(self, message: str = "User not found for the provided token."):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            error_code=HttpErrorCode.USER_NOT_FOUND,
            message=message,
        )


class ConversationNotFoundException(HttpBaseException):
    def __init__(self, message: str = "Conversation not found for the provided conversation id."):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            error_code=HttpErrorCode.CONVERSATION_NOT_FOUND,
            message=message,
        )
