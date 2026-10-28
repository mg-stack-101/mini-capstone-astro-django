"""Small environment readers shared by settings modules."""

import os


def env_bool(name, default=False):
    return os.getenv(name, str(default)).lower() in {"1", "true", "yes"}


def env_list(name, default=""):
    return [
        value.strip() for value in os.getenv(name, default).split(",") if value.strip()
    ]
