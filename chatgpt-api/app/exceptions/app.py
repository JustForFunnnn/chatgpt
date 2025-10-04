from enum import Enum


class AppErrorCode(str, Enum):
    DB_OPERATION_FAILED = "DB_OPERATION_FAILED"

    # USER_NOT_FOUND = "USER_NOT_FOUND"
    # INSUFFICIENT_FUNDS = "INSUFFICIENT_FUNDS"


class AppBaseException(Exception):
    def __init__(self, detail: str, error_code: AppErrorCode):
        self.detail = detail
        self.error_code = error_code
        super().__init__(detail)


class DatabaseError(AppBaseException):
    def __init__(self, detail: str = "Database operation failed."):
        super().__init__(detail=detail, error_code=AppErrorCode.DB_OPERATION_FAILED)
