import uuid
from django.conf import settings
from django.db import models
from common.uploads import evidence_path


class Complaint(models.Model):
    class Status(models.TextChoices):
        PENDING = "Pending", "Pending"
        PROCESSING = "Processing", "Processing"
        RESOLVED = "Resolved", "Resolved"

    class Type(models.TextChoices):
        NOISE = "Noise Disturbance", "Noise Disturbance"
        GARBAGE = "Garbage Disposal", "Garbage Disposal"
        PET = "Pet Nuisance", "Pet Nuisance"
        PROPERTY = "Property Dispute", "Property Dispute"
        VERBAL = "Verbal Altercation", "Verbal Altercation"
        OTHER = "Other", "Other"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    resident = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="complaints"
    )
    full_name = models.CharField(max_length=150)
    contact_number = models.CharField(max_length=30)
    address = models.CharField(max_length=300)
    complaint_type = models.CharField(max_length=40, choices=Type.choices)
    description = models.TextField(max_length=5000)
    photo = models.ImageField(upload_to=evidence_path)
    status = models.CharField(
        max_length=12, choices=Status.choices, default=Status.PENDING, db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at", "-id"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(status__in=["Pending", "Processing", "Resolved"]),
                name="valid_complaint_status",
            )
        ]

    def __str__(self):
        return f"{self.id} — {self.complaint_type}"


class ComplaintStatusChange(models.Model):
    complaint = models.ForeignKey(
        Complaint, on_delete=models.CASCADE, related_name="status_changes"
    )
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    from_status = models.CharField(max_length=12, choices=Complaint.Status.choices)
    to_status = models.CharField(max_length=12, choices=Complaint.Status.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-id"]
