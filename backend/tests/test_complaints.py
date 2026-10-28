from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from PIL import Image
from rest_framework.test import APIClient

from models.complaint import Complaint, ComplaintStatusChange
from .base import ApiTestCase, photo_upload


class ComplaintTests(ApiTestCase):
    def setUp(self):
        super().setUp()
        self.sign_in()

    def test_submit_saves_owned_complaint_and_private_photo(self):
        response = self.submit(resident=str(self.other.pk), status="Resolved")
        self.assertEqual(response.status_code, 201, response.json())
        complaint = Complaint.objects.get()
        self.assertEqual(complaint.resident_id, self.resident.pk)
        self.assertEqual(complaint.status, "Pending")
        self.assertEqual(response.json()["complaint"]["fullName"], "Sample Resident")
        self.assertEqual(response.json()["complaint"]["type"], "Other")
        with complaint.photo.open("rb") as file:
            with Image.open(file) as image:
                self.assertEqual(image.format, "PNG")

    def test_missing_photo_is_rejected(self):
        data = {
            "full_name": "Test",
            "contact_number": "09",
            "address": "Purok",
            "complaint_type": "Other",
            "description": "Description",
        }
        response = self.client.post(
            "/api/complaints/", data, HTTP_X_CSRFTOKEN=self.csrf()
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("photo", response.json()["errors"])

    def test_fake_image_bytes_are_rejected(self):
        response = self.submit(
            photo=SimpleUploadedFile(
                "fake.png", b"not an image", content_type="image/png"
            )
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Complaint.objects.count(), 0)

    def test_unsupported_image_format_is_rejected(self):
        self.assertEqual(self.submit(photo=photo_upload("GIF")).status_code, 400)

    def test_jpeg_is_accepted_and_normalized(self):
        self.assertEqual(self.submit(photo=photo_upload("JPEG")).status_code, 201)
        self.assertTrue(Complaint.objects.get().photo.name.endswith(".png"))

    @override_settings(MAX_PHOTO_BYTES=10)
    def test_file_size_limit_is_enforced(self):
        self.assertEqual(self.submit().status_code, 400)

    @override_settings(MAX_PHOTO_PIXELS=10)
    def test_image_resolution_limit_is_enforced(self):
        self.assertEqual(self.submit().status_code, 400)

    def test_blank_fields_and_unknown_types_are_rejected(self):
        self.assertEqual(self.submit(description="   ").status_code, 400)
        self.assertEqual(self.submit(complaint_type="Made up").status_code, 400)
        self.assertEqual(Complaint.objects.count(), 0)

    def test_submit_requires_authentication_and_csrf(self):
        response = self.client.post("/api/complaints/", {"description": "No token"})
        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            self.submit(client=APIClient(enforce_csrf_checks=True)).status_code, 403
        )

    def test_residents_cannot_read_another_residents_records_or_photo(self):
        complaint_id = self.submit().json()["complaint"]["id"]
        other = APIClient(enforce_csrf_checks=True)
        self.sign_in("other", "Other-password-482!", client=other)
        self.assertEqual(other.get("/api/complaints/").json()["count"], 0)
        self.assertEqual(other.get(f"/api/complaints/{complaint_id}/").status_code, 404)
        self.assertEqual(
            other.get(f"/api/complaints/{complaint_id}/photo/").status_code, 404
        )

    def test_owner_photo_download_is_private(self):
        complaint_id = self.submit().json()["complaint"]["id"]
        response = self.client.get(f"/api/complaints/{complaint_id}/photo/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("attachment", response["Content-Disposition"])
        self.assertEqual(response["Cache-Control"], "private, no-store")
        response.close()

    def test_resident_cannot_change_status(self):
        complaint_id = self.submit().json()["complaint"]["id"]
        response = self.client.patch(
            f"/api/complaints/{complaint_id}/status/",
            {"status": "Resolved"},
            format="json",
            HTTP_X_CSRFTOKEN=self.csrf(),
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(Complaint.objects.get().status, "Pending")

    def test_staff_can_list_all_and_change_status_with_audit(self):
        complaint_id = self.submit().json()["complaint"]["id"]
        self.sign_in("staff", "Staff-password-482!")
        self.assertEqual(self.client.get("/api/complaints/").json()["count"], 1)
        response = self.client.patch(
            f"/api/complaints/{complaint_id}/status/",
            {"status": "Processing"},
            format="json",
            HTTP_X_CSRFTOKEN=self.csrf(),
        )
        self.assertEqual(response.status_code, 200, response.json())
        audit = ComplaintStatusChange.objects.get()
        self.assertEqual(
            (audit.from_status, audit.to_status, audit.changed_by_id),
            ("Pending", "Processing", self.staff.pk),
        )
        self.assertEqual(len(response.json()["complaint"]["statusHistory"]), 1)
        self.client.patch(
            f"/api/complaints/{complaint_id}/status/",
            {"status": "Processing"},
            format="json",
            HTTP_X_CSRFTOKEN=self.csrf(),
        )
        self.assertEqual(ComplaintStatusChange.objects.count(), 1)

    def test_invalid_status_is_rejected(self):
        complaint_id = self.submit().json()["complaint"]["id"]
        self.sign_in("staff", "Staff-password-482!")
        response = self.client.patch(
            f"/api/complaints/{complaint_id}/status/",
            {"status": "Invalid"},
            format="json",
            HTTP_X_CSRFTOKEN=self.csrf(),
        )
        self.assertEqual(response.status_code, 400)

    def test_pagination_search_and_status_filter(self):
        self.submit(full_name="Alpha Resident", complaint_type="Noise Disturbance")
        self.submit(full_name="Beta Resident")
        page = self.client.get("/api/complaints/?page_size=1").json()
        self.assertEqual(page["count"], 2)
        self.assertEqual(len(page["results"]), 1)
        self.assertIsNotNone(page["next"])
        self.assertEqual(
            self.client.get("/api/complaints/?search=Alpha").json()["count"], 1
        )
        self.assertEqual(
            self.client.get("/api/complaints/?status=Resolved").json()["count"], 0
        )
        self.assertEqual(
            self.client.get("/api/complaints/?page_size=1000").status_code, 400
        )

    def test_staff_statistics_and_resident_denial(self):
        self.submit()
        self.assertEqual(self.client.get("/api/dashboard/").status_code, 403)
        self.sign_in("staff", "Staff-password-482!")
        data = self.client.get("/api/dashboard/").json()
        self.assertEqual(data["total"], 1)
        self.assertEqual(data["pending"], 1)
        self.assertEqual(data["registeredUsers"], 3)
