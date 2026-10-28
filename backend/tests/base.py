from io import BytesIO
from tempfile import TemporaryDirectory

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from PIL import Image
from rest_framework.test import APIClient


def photo_upload(format="PNG"):
    buffer = BytesIO()
    Image.new("RGB", (8, 8), "teal").save(buffer, format=format)
    suffix = "jpg" if format == "JPEG" else format.lower()
    return SimpleUploadedFile(
        f"photo.{suffix}", buffer.getvalue(), content_type=f"image/{suffix}"
    )


class ApiTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        User = get_user_model()
        cls.resident = User.objects.create_user(
            "resident", password="Test-password-482!", first_name="Sample Resident"
        )
        cls.other = User.objects.create_user("other", password="Other-password-482!")
        cls.staff = User.objects.create_user(
            "staff", password="Staff-password-482!", is_staff=True
        )

    def setUp(self):
        self.directory = TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        settings = override_settings(MEDIA_ROOT=self.directory.name)
        settings.enable()
        self.addCleanup(settings.disable)
        cache.clear()
        self.client = APIClient(enforce_csrf_checks=True)

    def csrf(self, client=None):
        client = client or self.client
        return client.get("/api/csrf/").json()["csrfToken"]

    def sign_in(
        self,
        username="resident",
        password="Test-password-482!",
        client=None,
        remember=False,
    ):
        client = client or self.client
        return client.post(
            "/api/login/",
            {"username": username, "password": password, "remember_me": remember},
            format="json",
            HTTP_X_CSRFTOKEN=self.csrf(client),
        )

    def submit(self, client=None, **overrides):
        client = client or self.client
        data = {
            "full_name": "Sample Resident",
            "contact_number": "09123456789",
            "address": "Sample Purok",
            "complaint_type": "Other",
            "description": "A sample concern.",
            "photo": photo_upload(),
        }
        data.update(overrides)
        return client.post(
            "/api/complaints/",
            data,
            format="multipart",
            HTTP_X_CSRFTOKEN=self.csrf(client),
        )
