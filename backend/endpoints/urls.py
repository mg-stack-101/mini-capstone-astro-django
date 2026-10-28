"""Route composition only; request handling belongs in controllers."""

from django.urls import include, path

urlpatterns = [
    path("", include("endpoints.auth")),
    path("complaints/", include("endpoints.complaints")),
    path("", include("endpoints.dashboard")),
]
