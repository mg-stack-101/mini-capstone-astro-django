from django.http import FileResponse, Http404
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from common.throttles import ComplaintCreateThrottle
from permissions.roles import IsStaff
from queries.complaints import filtered_complaints, find_complaint
from serializers.complaints import (
    ComplaintCreateSerializer,
    ComplaintDetailSerializer,
    ComplaintQuerySerializer,
    ComplaintReadSerializer,
    ComplaintStatusSerializer,
)
from services.complaints import change_status, create_complaint


class ComplaintPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class ComplaintListController(APIView):
    def get_throttles(self):
        return [ComplaintCreateThrottle()] if self.request.method == "POST" else []

    def get(self, request):
        query = ComplaintQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        values = query.validated_data
        queryset = filtered_complaints(
            request.user,
            search=values.get("search", ""),
            status=values.get("status", ""),
        )
        paginator = ComplaintPagination()
        page = paginator.paginate_queryset(queryset, request)
        return paginator.get_paginated_response(
            ComplaintReadSerializer(page, many=True).data
        )

    def post(self, request):
        serializer = ComplaintCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        complaint = create_complaint(
            resident=request.user, validated_data=serializer.validated_data
        )
        return Response(
            {
                "message": "Your complaint has been submitted.",
                "complaint": ComplaintReadSerializer(complaint).data,
            },
            status=201,
        )


class ComplaintDetailController(APIView):
    def get(self, request, complaint_id):
        complaint = find_complaint(request.user, complaint_id)
        return Response(ComplaintDetailSerializer(complaint).data)


class ComplaintStatusController(APIView):
    permission_classes = [IsStaff]

    def patch(self, request, complaint_id):
        complaint = find_complaint(request.user, complaint_id)
        serializer = ComplaintStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        complaint = change_status(
            complaint_id=complaint.pk, actor=request.user, **serializer.validated_data
        )
        return Response(
            {
                "message": "Status updated.",
                "complaint": ComplaintDetailSerializer(complaint).data,
            }
        )


class ComplaintPhotoController(APIView):
    def get(self, request, complaint_id):
        complaint = find_complaint(request.user, complaint_id)
        try:
            photo = complaint.photo.open("rb")
        except FileNotFoundError as exc:
            raise Http404("Photo not found.") from exc
        response = FileResponse(
            photo,
            content_type="image/png",
            as_attachment=True,
            filename=f"evidence-{complaint.pk}.png",
        )
        response["Cache-Control"] = "private, no-store"
        return response
