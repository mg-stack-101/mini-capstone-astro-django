from django.urls import path
from .views import live, ready

urlpatterns = [
    path("", live, name="health"),
    path("live/", live, name="health-live"),
    path("ready/", ready, name="health-ready"),
]
