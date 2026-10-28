from django.contrib.auth import get_user_model
from .base import ApiTestCase


class AuthenticationTests(ApiTestCase):
    def test_anonymous_cannot_read_session_or_complaints(self):
        self.assertEqual(self.client.get("/api/me/").status_code, 403)
        self.assertEqual(self.client.get("/api/complaints/").status_code, 403)

    def test_login_requires_csrf_even_when_anonymous(self):
        response = self.client.post(
            "/api/login/",
            {"username": "resident", "password": "Test-password-482!"},
            format="json",
        )
        self.assertEqual(response.status_code, 403)
        self.assertIn("message", response.json())

    def test_valid_login_returns_role_and_persists_session(self):
        response = self.sign_in()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["user"]["role"], "resident")
        self.assertEqual(
            self.client.get("/api/me/").json()["user"]["username"], "resident"
        )
        self.assertTrue(self.client.session.get_expire_at_browser_close())

    def test_remember_me_sets_persistent_session(self):
        self.assertEqual(self.sign_in(remember=True).status_code, 200)
        self.assertFalse(self.client.session.get_expire_at_browser_close())

    def test_bad_credentials_and_inactive_users_are_rejected(self):
        response = self.sign_in(password="wrong")
        self.assertEqual(response.status_code, 403)
        self.assertIn("Incorrect", response.json()["message"])
        get_user_model().objects.filter(pk=self.resident.pk).update(is_active=False)
        self.assertEqual(self.sign_in().status_code, 403)

    def test_login_throttles_repeated_attempts(self):
        for _ in range(10):
            self.assertEqual(self.sign_in(password="wrong").status_code, 403)
        self.assertEqual(self.sign_in(password="wrong").status_code, 429)

    def test_staff_role_is_derived_from_database(self):
        response = self.sign_in(username="staff", password="Staff-password-482!")
        self.assertEqual(response.json()["user"]["role"], "admin")

    def test_logout_requires_post_and_csrf_then_invalidates_session(self):
        self.sign_in()
        self.assertEqual(self.client.get("/api/logout/").status_code, 405)
        self.assertEqual(self.client.post("/api/logout/").status_code, 403)
        response = self.client.post("/api/logout/", HTTP_X_CSRFTOKEN=self.csrf())
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.client.get("/api/me/").status_code, 403)

    def test_untrusted_origin_cannot_log_in(self):
        response = self.client.post(
            "/api/login/",
            {"username": "resident", "password": "Test-password-482!"},
            format="json",
            HTTP_X_CSRFTOKEN=self.csrf(),
            HTTP_ORIGIN="https://untrusted.invalid",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_responses_are_not_cached(self):
        self.assertEqual(
            self.client.get("/api/csrf/")["Cache-Control"], "private, no-store"
        )
