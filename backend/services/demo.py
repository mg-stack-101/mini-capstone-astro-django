"""Explicit development-only fixtures; never executed at application startup."""

from io import BytesIO
from uuid import NAMESPACE_URL, uuid5

from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.db import transaction
from django.utils import timezone
from PIL import Image, ImageDraw

from models.complaint import Complaint
from services.complaints import change_status

DEMO_ACCOUNTS = [
    {
        "username": "admin",
        "password": "admin",
        "name": "Demo Administrator",
        "staff": True,
        "superuser": True,
    },
    {
        "username": "staff1",
        "password": "StaffDemo123!",
        "name": "Demo Staff",
        "staff": True,
        "superuser": False,
    },
    {
        "username": "resident1",
        "password": "ResidentDemo123!",
        "name": "Demo Resident One",
        "staff": False,
        "superuser": False,
    },
    {
        "username": "resident2",
        "password": "ResidentDemo456!",
        "name": "Demo Resident Two",
        "staff": False,
        "superuser": False,
    },
]

DEMO_COMPLAINTS = [
    (
        "noise",
        "resident1",
        "Noise Disturbance",
        "Pending",
        "Sample report: loud music near the community area.",
    ),
    (
        "garbage",
        "resident1",
        "Garbage Disposal",
        "Processing",
        "Sample report: uncollected waste at the designated collection point.",
    ),
    (
        "pet",
        "resident1",
        "Pet Nuisance",
        "Resolved",
        "Sample report: an unattended pet near the walkway.",
    ),
    (
        "property",
        "resident2",
        "Property Dispute",
        "Pending",
        "Sample report: a concern about a shared boundary.",
    ),
    (
        "verbal",
        "resident2",
        "Verbal Altercation",
        "Processing",
        "Sample report: a disagreement near the community area.",
    ),
    (
        "other",
        "resident2",
        "Other",
        "Resolved",
        "Sample report: a damaged community notice board.",
    ),
]


def demo_photo(label):
    image = Image.new("RGB", (640, 360), "#e3f4f6")
    draw = ImageDraw.Draw(image)
    draw.text((35, 40), "DEMO EVIDENCE - NOT A REAL INCIDENT", fill="#1e4e54")
    draw.text((35, 80), label, fill="#1e4e54")
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return ContentFile(buffer.getvalue(), name="demo.png")


@transaction.atomic
def seed_demo(*, reset_passwords=False):
    User = get_user_model()
    accounts = {}
    files_created = []
    try:
        for item in DEMO_ACCOUNTS:
            user, created = User.objects.get_or_create(
                username=item["username"],
                defaults={
                    "email": f"{item['username']}@demo.invalid",
                    "first_name": item["name"],
                    "is_staff": item["staff"],
                    "is_superuser": item["superuser"],
                    "is_active": True,
                },
            )
            if not created and (
                user.email != f"{item['username']}@demo.invalid"
                or user.is_staff != item["staff"]
                or user.is_superuser != item["superuser"]
                or not user.is_active
            ):
                raise ValueError(
                    f"Account '{user.username}' already exists and is not a matching demo account. No existing account was overwritten."
                )
            if created or reset_passwords:
                # These deliberately requested demo passwords bypass validators,
                # but are still hashed with Django's configured password hasher.
                user.set_password(item["password"])
                user.save(update_fields=["password"])
            accounts[item["username"]] = user

        created_count = 0
        for index, (key, owner, kind, status, description) in enumerate(
            DEMO_COMPLAINTS
        ):
            complaint_id = uuid5(NAMESPACE_URL, f"barangay-complaints:demo:{key}")
            complaint = Complaint.objects.filter(pk=complaint_id).first()
            if complaint is not None:
                if complaint.resident_id != accounts[owner].pk:
                    raise ValueError(
                        "A demo complaint ID is already owned by another account."
                    )
                continue

            complaint = Complaint(
                id=complaint_id,
                resident=accounts[owner],
                full_name=accounts[owner].get_full_name(),
                contact_number=f'0900000000{1 if owner == "resident1" else 2}',
                address=f'DEMO ADDRESS ONLY - Sample Purok {1 if owner == "resident1" else 2}',
                complaint_type=kind,
                description=description,
            )
            complaint.photo.save(f"{key}.png", demo_photo(kind), save=False)
            files_created.append(complaint.photo)
            complaint.save()
            if status != Complaint.Status.PENDING:
                change_status(
                    complaint_id=complaint.pk, actor=accounts["admin"], status=status
                )
            Complaint.objects.filter(pk=complaint.pk).update(
                created_at=timezone.now() - timezone.timedelta(days=index),
            )
            created_count += 1
        return created_count
    except Exception:
        for photo in files_created:
            photo.delete(save=False)
        raise
