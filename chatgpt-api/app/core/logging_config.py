from pathlib import Path

LOGS_DIR = Path(__file__).resolve().parent.parent.parent / "logs"
LOGS_DIR.mkdir(exist_ok=True)


LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "default",
            "level": "INFO",
        },
        "file_info": {
            "class": "logging.handlers.TimedRotatingFileHandler",
            "formatter": "default",
            "filename": LOGS_DIR / "info.log",
            "when": "midnight",
            "interval": 1,
            "backupCount": 0,
            "level": "INFO",
            "encoding": "utf-8",
        },
        "file_warn": {
            "class": "logging.handlers.TimedRotatingFileHandler",
            "formatter": "default",
            "filename": LOGS_DIR / "warn.log",
            "when": "midnight",
            "interval": 1,
            "backupCount": 0,
            "level": "WARNING",
            "encoding": "utf-8",
        },
        "file_error": {
            "class": "logging.handlers.TimedRotatingFileHandler",
            "formatter": "json",
            "filename": LOGS_DIR / "error.log",
            "when": "midnight",
            "interval": 1,
            "backupCount": 0,
            "level": "ERROR",
            "encoding": "utf-8",
        },
    },
    "loggers": {
        "uvicorn.access": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "app": {
            "handlers": ["console", "file_info", "file_warn", "file_error"],
            "level": "INFO",
            "propagate": False,
        },
    },
    "root": {
        "handlers": ["console", "file_info", "file_warn", "file_error"],
        "level": "INFO",
    },
}
