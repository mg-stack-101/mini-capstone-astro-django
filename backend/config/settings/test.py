from .base import *  # noqa: F403

# Faster hashing for disposable test accounts only. Never use these settings to serve traffic.
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
