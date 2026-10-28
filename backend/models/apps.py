from django.apps import AppConfig


class BarangayConfig(AppConfig):
    name = "models"
    label = "barangay"
    verbose_name = "Barangay Complaint System"
    default_auto_field = "django.db.models.BigAutoField"
