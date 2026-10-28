"""Explicit credentialed origins. Wildcard CORS is intentionally disabled."""

from config.env import env_list

CORS_ALLOWED_ORIGINS = env_list(
    "DJANGO_CORS_ORIGINS", "http://localhost:4321,http://127.0.0.1:4321"
)
CORS_ALLOW_CREDENTIALS = True
CORS_URLS_REGEX = r"^/api/.*$"
CSRF_TRUSTED_ORIGINS = env_list(
    "DJANGO_CSRF_ORIGINS", "http://localhost:4321,http://127.0.0.1:4321"
)
