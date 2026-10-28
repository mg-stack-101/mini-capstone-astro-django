from rest_framework.permissions import BasePermission


class IsStaff(BasePermission):
    message = "Only barangay administrators can perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user.is_authenticated
            and request.user.is_active
            and request.user.is_staff
        )
