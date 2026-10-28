"""Database configuration, kept separate from the main Django settings."""

import os

import dj_database_url
from django.core.exceptions import ImproperlyConfigured


def database_settings(base_dir):
    url = os.getenv("DATABASE_URL", "").strip()
    if not url:
        return {"ENGINE": "django.db.backends.sqlite3", "NAME": base_dir / "db.sqlite3"}

    database = dj_database_url.parse(url, conn_max_age=0, conn_health_checks=True)
    if database["ENGINE"] != "django.db.backends.postgresql":
        raise ImproperlyConfigured("DATABASE_URL must be a PostgreSQL connection URL.")

    database["DISABLE_SERVER_SIDE_CURSORS"] = True
    options = database.setdefault("OPTIONS", {})
    options.setdefault("sslmode", "require")
    options.setdefault("connect_timeout", 10)
    options["prepare_threshold"] = None
    try:
        max_size = int(os.getenv("DB_POOL_MAX_SIZE", "4"))
    except ValueError as exc:
        raise ImproperlyConfigured("DB_POOL_MAX_SIZE must be a positive integer.") from exc
    if max_size < 1:
        raise ImproperlyConfigured("DB_POOL_MAX_SIZE must be a positive integer.")

    # Return connections to this process-wide pool after each request. Unlike
    # thread-local persistent connections, it also serves new request threads.
    options["pool"] = {"min_size": 1, "max_size": max_size, "timeout": 10}
    return database
