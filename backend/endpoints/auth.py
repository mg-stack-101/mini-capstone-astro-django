from django.urls import path
from controllers.auth import (
    CsrfController,
    LoginController,
    LogoutController,
    MeController,
)

urlpatterns = [
    path("csrf/", CsrfController.as_view(), name="csrf"),
    path("login/", LoginController.as_view(), name="login"),
    path("logout/", LogoutController.as_view(), name="logout"),
    path("me/", MeController.as_view(), name="me"),
]
