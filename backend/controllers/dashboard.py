from rest_framework.response import Response
from rest_framework.views import APIView
from permissions.roles import IsStaff
from queries.dashboard import dashboard_statistics


class DashboardController(APIView):
    permission_classes = [IsStaff]

    def get(self, request):
        return Response(dashboard_statistics())
