import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from starlette import status

from app.exceptions.app_error import AppBaseError, DatabaseError
from app.exceptions.http_exceptions import HttpBaseException

logger = logging.getLogger("app")


async def http_base_exception_handler(request: Request, exc: HttpBaseException):
    log_level = logging.WARNING if 400 <= exc.status_code < 500 else logging.ERROR
    logger.log(log_level, f"Custom HTTP error, error_code: {exc.error_code}, message: {exc.message}")
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.detail,
        headers=exc.headers,
    )


async def generic_http_exception_handler(request: Request, exc: HTTPException):
    log_level = logging.WARNING if 400 <= exc.status_code < 500 else logging.ERROR
    logger.log(log_level, f"Generic HTTP error, status_code: {exc.status_code}, detail: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"error_code": "GENERIC_HTTP_ERROR", "message": exc.detail},
        headers=exc.headers,
    )


async def database_exception_handler(request: Request, exc: DatabaseError):
    logger.error(f"Database error, error_code: {exc.error_code}, message: {exc.message}")
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"error_code": exc.error_code.value, "message": "The service is temporarily unavailable due to a database issue."},
    )


async def app_exception_handler(request: Request, exc: AppBaseError):
    logger.warning(f"App error, error_code: {exc.error_code}, message: {exc.message}")
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"error_code": exc.error_code.value, "message": exc.message},
    )


async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"An unhandled exception occurred: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"message": "An internal server error occurred. Please try again later."},
    )


def register_exception_handlers(app: FastAPI):
    app.add_exception_handler(HttpBaseException, http_base_exception_handler)
    app.add_exception_handler(HTTPException, generic_http_exception_handler)
    app.add_exception_handler(DatabaseError, database_exception_handler)
    app.add_exception_handler(AppBaseError, app_exception_handler)
    app.add_exception_handler(Exception, generic_exception_handler)
