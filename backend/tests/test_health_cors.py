from unittest.mock import patch
from django.db import DatabaseError
from .base import ApiTestCase


class HealthCorsTests(ApiTestCase):
    def test_health_endpoints_are_public(self):
        self.assertEqual(self.client.get("/health/").json(), {"status": "ok"})
        self.assertEqual(self.client.get("/health/live/").status_code, 200)
        self.assertEqual(self.client.get("/health/ready/").json(), {"status": "ready"})

    def test_readiness_reports_database_failure_without_details(self):
        with patch(
            "health.views.connection.cursor",
            side_effect=DatabaseError("private connection information"),
        ):
            response = self.client.get("/health/ready/")
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json(), {"status": "unavailable"})

    def test_cors_allows_configured_origin_with_credentials(self):
        response = self.client.options(
            "/api/complaints/",
            HTTP_ORIGIN="http://localhost:4321",
            HTTP_ACCESS_CONTROL_REQUEST_METHOD="POST",
            HTTP_ACCESS_CONTROL_REQUEST_HEADERS="x-csrftoken,content-type",
        )
        self.assertEqual(
            response["Access-Control-Allow-Origin"], "http://localhost:4321"
        )
        self.assertEqual(response["Access-Control-Allow-Credentials"], "true")

    def test_cors_does_not_grant_unconfigured_origin(self):
        response = self.client.get(
            "/api/csrf/", HTTP_ORIGIN="https://untrusted.invalid"
        )
        self.assertNotIn("Access-Control-Allow-Origin", response)
