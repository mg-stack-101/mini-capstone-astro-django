from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html
from .complaint import Complaint, ComplaintStatusChange


@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = ["id", "full_name", "complaint_type", "status", "created_at"]
    list_filter = ["status", "complaint_type"]
    search_fields = ["full_name", "description"]
    # Mutations go through the API service so status history stays consistent.
    exclude = ["photo"]
    readonly_fields = [
        "id",
        "resident",
        "full_name",
        "contact_number",
        "address",
        "complaint_type",
        "description",
        "photo_download",
        "status",
        "created_at",
        "updated_at",
    ]

    @admin.display(description="Evidence photo")
    def photo_download(self, obj):
        return format_html(
            '<a href="{}">Download evidence</a>',
            reverse("complaint-photo", args=[obj.pk]),
        )

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(ComplaintStatusChange)
class StatusChangeAdmin(admin.ModelAdmin):
    list_display = ["complaint", "from_status", "to_status", "changed_by", "created_at"]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
