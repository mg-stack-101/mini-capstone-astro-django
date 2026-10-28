from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from models.complaint import Complaint


def dashboard_statistics():
    stats = Complaint.objects.aggregate(
        total=Count("id"),
        pending=Count("id", filter=Q(status=Complaint.Status.PENDING)),
        processing=Count("id", filter=Q(status=Complaint.Status.PROCESSING)),
        resolved=Count("id", filter=Q(status=Complaint.Status.RESOLVED)),
    )
    stats["registeredUsers"] = get_user_model().objects.filter(is_active=True).count()
    return stats
