from io import StringIO

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import override_settings

from models.complaint import Complaint, ComplaintStatusChange
from .base import ApiTestCase


@override_settings(DEBUG=True)
class DemoSeedTests(ApiTestCase):
    def seed(self, **kwargs):
        call_command("seed_demo", stdout=StringIO(), **kwargs)

    def test_creates_hashed_credentials_complaints_history_and_photos(self):
        self.seed()
        admin = get_user_model().objects.get(username="admin")
        self.assertTrue(
            admin.is_superuser and admin.is_staff and admin.check_password("admin")
        )
        self.assertNotEqual(admin.password, "admin")
        self.assertEqual(Complaint.objects.count(), 6)
        self.assertEqual(ComplaintStatusChange.objects.count(), 4)
        for status in Complaint.Status.values:
            self.assertEqual(Complaint.objects.filter(status=status).count(), 2)
        for complaint in Complaint.objects.all():
            self.assertTrue(complaint.photo.storage.exists(complaint.photo.name))

    def test_rerun_does_not_duplicate_data_or_reset_changed_passwords(self):
        self.seed()
        admin = get_user_model().objects.get(username="admin")
        admin.set_password("Changed-after-seeding!")
        admin.save()
        self.seed()
        admin.refresh_from_db()
        self.assertTrue(admin.check_password("Changed-after-seeding!"))
        self.assertEqual(Complaint.objects.count(), 6)
        self.assertEqual(ComplaintStatusChange.objects.count(), 4)
        self.seed(reset_passwords=True)
        admin.refresh_from_db()
        self.assertTrue(admin.check_password("admin"))

    @override_settings(DEBUG=False)
    def test_seed_is_blocked_with_debug_disabled(self):
        with self.assertRaises(CommandError):
            self.seed()
        self.assertFalse(get_user_model().objects.filter(username="admin").exists())

    def test_does_not_replace_or_promote_an_existing_account(self):
        original = get_user_model().objects.create_user(
            "admin", password="Existing-secret!"
        )
        with self.assertRaises(CommandError):
            self.seed()
        original.refresh_from_db()
        self.assertFalse(original.is_superuser)
        self.assertTrue(original.check_password("Existing-secret!"))

    def test_seeded_residents_only_see_their_three_complaints(self):
        self.seed()
        response = self.sign_in("resident1", "ResidentDemo123!")
        self.assertEqual(response.status_code, 200)
        data = self.client.get("/api/complaints/").json()
        self.assertEqual(data["count"], 3)
        self.assertTrue(
            all(c["fullName"] == "Demo Resident One" for c in data["results"])
        )

    def test_seeded_admin_authenticates_with_admin_password(self):
        self.seed()
        response = self.sign_in("admin", "admin")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["user"]["role"], "admin")
