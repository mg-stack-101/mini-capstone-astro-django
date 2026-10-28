"""Complaint writes, photo normalization, and status audit history."""

from io import BytesIO

from django.core.files.base import ContentFile
from django.db import transaction
from PIL import Image, ImageOps
from rest_framework.exceptions import ValidationError

from models.complaint import Complaint, ComplaintStatusChange


def normalize_photo(upload):
    """Decode and re-encode verified evidence, dropping EXIF and embedded payloads."""
    try:
        upload.seek(0)
        with Image.open(upload) as image:
            image.load()
            image = ImageOps.exif_transpose(image)
            output = BytesIO()
            # A fresh pixel image keeps EXIF and embedded payloads out of storage.
            clean = Image.new("RGB", image.size, "white")
            clean.paste(image.convert("RGB"))
            clean.save(output, format="PNG", optimize=True)
        return ContentFile(output.getvalue(), name="evidence.png")
    except (OSError, ValueError, Image.DecompressionBombError) as exc:
        raise ValidationError(
            {"photo": "Unable to read this photo. Please choose another image."}
        ) from exc


def create_complaint(*, resident, validated_data):
    data = dict(validated_data)
    data["photo"] = normalize_photo(data["photo"])
    complaint = Complaint(resident=resident, **data)
    try:
        with transaction.atomic():
            complaint.save()
    except Exception:
        # File storage is outside database transactions; undo a failed save's file.
        if complaint.photo and complaint.photo._committed:
            complaint.photo.delete(save=False)
        raise
    return complaint


@transaction.atomic
def change_status(*, complaint_id, actor, status):
    complaint = Complaint.objects.select_for_update().get(pk=complaint_id)
    if complaint.status != status:
        ComplaintStatusChange.objects.create(
            complaint=complaint,
            changed_by=actor,
            from_status=complaint.status,
            to_status=status,
        )
        complaint.status = status
        complaint.save(update_fields=["status", "updated_at"])
    return complaint
