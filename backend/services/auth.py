"""Session lifecycle and credential handling, independent of HTTP serialization."""

from django.contrib.auth import authenticate, login, logout
from rest_framework.exceptions import AuthenticationFailed


def sign_in(request, *, username, password, remember_me=False):
    user = authenticate(request, username=username, password=password)
    if user is None:
        raise AuthenticationFailed("Incorrect username or password.")
    login(request, user)
    request.session.set_expiry(60 * 60 * 24 * 14 if remember_me else 0)
    return user


def sign_out(request):
    logout(request)
