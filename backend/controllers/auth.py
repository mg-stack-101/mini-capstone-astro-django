from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from common.throttles import LoginThrottle
from serializers.auth import LoginSerializer, UserSerializer
from services.auth import sign_in, sign_out


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CsrfController(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        return Response({"csrfToken": get_token(request)})


# DRF SessionAuthentication only checks CSRF after authentication. Login must
# explicitly protect anonymous requests as well.
@method_decorator(csrf_protect, name="dispatch")
class LoginController(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [LoginThrottle]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = sign_in(request, **serializer.validated_data)
        return Response({"user": UserSerializer(user).data, "message": "Signed in."})


class MeController(APIView):
    def get(self, request):
        return Response({"user": UserSerializer(request.user).data})


class LogoutController(APIView):
    def post(self, request):
        sign_out(request)
        return Response({"message": "Signed out."})
