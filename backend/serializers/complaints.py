from django.conf import settings
from django.utils import timezone
from rest_framework import serializers
from models.complaint import Complaint, ComplaintStatusChange


class ComplaintCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Complaint
        fields = [
            "full_name",
            "contact_number",
            "address",
            "complaint_type",
            "description",
            "photo",
        ]

    def validate_photo(self, photo):
        if photo.size > settings.MAX_PHOTO_BYTES:
            raise serializers.ValidationError("The photo must be 5 MB or smaller.")
        image = photo.image  # DRF ImageField has already verified image bytes.
        if image.format not in {"JPEG", "PNG"}:
            raise serializers.ValidationError("Only JPG and PNG images are accepted.")
        if image.width * image.height > settings.MAX_PHOTO_PIXELS:
            raise serializers.ValidationError(
                "The photo resolution is too large (maximum 25 megapixels)."
            )
        return photo


class ComplaintReadSerializer(serializers.ModelSerializer):
    fullName = serializers.CharField(source="full_name")
    type = serializers.CharField(source="complaint_type")
    dateFiled = serializers.SerializerMethodField()
    photoUrl = serializers.SerializerMethodField()

    class Meta:
        model = Complaint
        fields = [
            "id",
            "fullName",
            "type",
            "dateFiled",
            "status",
            "description",
            "photoUrl",
        ]

    def get_dateFiled(self, complaint):
        return timezone.localtime(complaint.created_at).date().isoformat()

    def get_photoUrl(self, complaint):
        return f"/api/complaints/{complaint.pk}/photo/"


class StatusChangeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComplaintStatusChange
        fields = ["from_status", "to_status", "created_at"]


class ComplaintDetailSerializer(ComplaintReadSerializer):
    contactNumber = serializers.CharField(source="contact_number")
    statusHistory = StatusChangeSerializer(source="status_changes", many=True)

    class Meta(ComplaintReadSerializer.Meta):
        fields = ComplaintReadSerializer.Meta.fields + [
            "contactNumber",
            "address",
            "statusHistory",
        ]


class ComplaintStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Complaint.Status.choices)


class ComplaintQuerySerializer(serializers.Serializer):
    search = serializers.CharField(required=False, allow_blank=True, max_length=150)
    status = serializers.ChoiceField(
        required=False, allow_blank=True, choices=Complaint.Status.choices
    )
    page = serializers.IntegerField(required=False, min_value=1)
    page_size = serializers.IntegerField(required=False, min_value=1, max_value=100)
