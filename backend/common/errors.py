"""One predictable JSON error envelope for frontend feedback."""

from django.http import JsonResponse
from rest_framework.views import exception_handler


def first_message(value):
    if isinstance(value, dict):
        if "detail" in value:
            return str(value["detail"])
        key = next(iter(value), None)
        return f"{key}: {first_message(value[key])}" if key else "Request failed."
    if isinstance(value, list):
        return first_message(value[0]) if value else "Request failed."
    return str(value)


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        original = response.data
        response.data = {"message": first_message(original), "errors": original}
    return response


def csrf_failure(request, reason=""):
    return JsonResponse(
        {"message": "CSRF verification failed. Refresh the page and try again."},
        status=403,
    )
