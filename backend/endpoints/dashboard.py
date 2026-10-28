from django.urls import path
from controllers.dashboard import DashboardController

urlpatterns = [path("dashboard/", DashboardController.as_view(), name="dashboard")]
