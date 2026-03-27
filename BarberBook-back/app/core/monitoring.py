"""
Monitoring and error tracking setup with Sentry.
Initialize before starting the app.
"""

import logging
import os
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration


def init_sentry():
    """Initialize Sentry error tracking.
    
    Set SENTRY_DSN environment variable to enable.
    Example: https://examplePublicKey@o0.ingest.sentry.io/0
    """
    sentry_dsn = os.getenv("SENTRY_DSN")
    if not sentry_dsn:
        return None

    environment = os.getenv("APP_ENV", "development")

    sentry_sdk.init(
        dsn=sentry_dsn,
        integrations=[
            FastApiIntegration(),
            SqlalchemyIntegration(),
        ],
        environment=environment,
        traces_sample_rate=0.1 if environment == "production" else 1.0,
        profiles_sample_rate=0.1 if environment == "production" else 1.0,
        debug=environment == "development",
    )
    
    logger = logging.getLogger(__name__)
    logger.info(f"Sentry initialized for {environment} environment")


def setup_logging():
    """Configure Python logging.
    
    Logs to console and optionally to Sentry for errors.
    """
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    # Set FastAPI/Uvicorn log levels
    logging.getLogger("fastapi").setLevel(logging.INFO)
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("sqlalchemy").setLevel(logging.WARNING)
