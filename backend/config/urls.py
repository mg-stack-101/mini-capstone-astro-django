from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("health/", include("health.urls")),
    path("api/", include("endpoints.urls")),
    path("django-admin/", admin.site.urls),
]
