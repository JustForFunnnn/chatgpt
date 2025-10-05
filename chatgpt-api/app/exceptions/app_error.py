from enum import Enum


class AppErrorCode(str, Enum):
    DB_OPERATION_FAILED = "DB_OPERATION_FAILED"
    USER_NOT_FOUND = "USER_NOT_FOUND"


class AppBaseError(Exception):
    def __init__(self, message: str, error_code: AppErrorCode):
        self.message = message
        self.error_code = error_code
        super().__init__(message)


class DatabaseError(AppBaseError):
    def __init__(self, message: str = "Database operation failed."):
        super().__init__(message=message, error_code=AppErrorCode.DB_OPERATION_FAILED)


class UserNotFoundError(AppBaseError):
    def __init__(self, detail: str = "User not found."):
        super().__init__(detail=detail, error_code=AppErrorCode.USER_NOT_FOUND)
