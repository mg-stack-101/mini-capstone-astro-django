"""Read-only database queries. Authorization is applied before filtering."""

from django.db.models import Q
from django.shortcuts import get_object_or_404
from models.complaint import Complaint


def visible_complaints(user):
    queryset = Complaint.objects.select_related("resident")
    return queryset if user.is_staff else queryset.filter(resident=user)


def find_complaint(user, complaint_id):
    return get_object_or_404(visible_complaints(user), pk=complaint_id)


def filtered_complaints(user, *, search="", status=""):
    queryset = visible_complaints(user)
    if search:
        import uuid

        condition = Q(full_name__icontains=search) | Q(complaint_type__icontains=search)
        try:
            condition |= Q(id=uuid.UUID(search))
        except ValueError:
            pass
        queryset = queryset.filter(condition)
    if status:
        queryset = queryset.filter(status=status)
    return queryset
