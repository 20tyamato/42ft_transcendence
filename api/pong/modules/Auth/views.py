from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import LoginSerializer


class LoginView(APIView):
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        if Token.objects.filter(user=user).exists():
            return Response(
                {"message": "User is already logged in. Logout from the other device."},
                status=status.HTTP_403_FORBIDDEN,
            )

        token = Token.objects.create(user=user)
        return Response(
            {
                "message": "Login Success",
                "token": token.key,
                "user_id": user.id,
                "username": user.username,
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response({"message": "Logout successful"}, status=status.HTTP_200_OK)
