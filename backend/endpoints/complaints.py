from django.urls import path
from controllers.complaints import (
    ComplaintDetailController,
    ComplaintListController,
    ComplaintPhotoController,
    ComplaintStatusController,
)

urlpatterns = [
    path("", ComplaintListController.as_view(), name="complaint-list"),
    path(
        "<uuid:complaint_id>/",
        ComplaintDetailController.as_view(),
        name="complaint-detail",
    ),
    path(
        "<uuid:complaint_id>/status/",
        ComplaintStatusController.as_view(),
        name="complaint-status",
    ),
    path(
        "<uuid:complaint_id>/photo/",
        ComplaintPhotoController.as_view(),
        name="complaint-photo",
    ),
]
