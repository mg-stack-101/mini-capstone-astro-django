from pathlib import Path
from unittest.mock import patch

from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase

from config.database import database_settings


class DatabaseConfigurationTests(SimpleTestCase):
    @patch.dict("os.environ", {"DATABASE_URL": ""})
    def test_empty_url_keeps_sqlite(self):
        self.assertEqual(
            database_settings(Path("/tmp"))["ENGINE"], "django.db.backends.sqlite3"
        )

    @patch.dict(
        "os.environ",
        {"DATABASE_URL": "postgresql://demo:password@example.invalid:5432/postgres"},
    )
    def test_postgres_url_gets_ssl_and_safe_pooler_options(self):
        config = database_settings(Path("/tmp"))
        self.assertEqual(config["ENGINE"], "django.db.backends.postgresql")
        self.assertEqual(config["OPTIONS"]["sslmode"], "require")
        self.assertIsNone(config["OPTIONS"]["prepare_threshold"])
        self.assertTrue(config["DISABLE_SERVER_SIDE_CURSORS"])
        self.assertEqual(config["CONN_MAX_AGE"], 0)
        self.assertTrue(config["CONN_HEALTH_CHECKS"])
        self.assertEqual(
            config["OPTIONS"]["pool"],
            {"min_size": 1, "max_size": 4, "timeout": 10},
        )

    @patch.dict("os.environ", {"DATABASE_URL": "sqlite:///wrong.sqlite3"})
    def test_non_postgres_url_is_rejected(self):
        with self.assertRaises(ImproperlyConfigured):
            database_settings(Path("/tmp"))

    @patch.dict(
        "os.environ",
        {
            "DATABASE_URL": "postgresql://demo:password@example.invalid:5432/postgres",
            "DB_POOL_MAX_SIZE": "2",
        },
    )
    def test_pool_size_can_match_worker_connection_budget(self):
        config = database_settings(Path("/tmp"))
        self.assertEqual(config["OPTIONS"]["pool"]["max_size"], 2)

    @patch.dict(
        "os.environ",
        {"DATABASE_URL": "postgresql://demo:password@example.invalid:5432/postgres"},
    )
    def test_invalid_pool_sizes_are_rejected(self):
        for value in ("0", "-1", "invalid"):
            with self.subTest(value=value), patch.dict(
                "os.environ", {"DB_POOL_MAX_SIZE": value}
            ):
                with self.assertRaises(ImproperlyConfigured):
                    database_settings(Path("/tmp"))
