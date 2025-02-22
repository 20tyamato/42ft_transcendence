from rest_framework import generics, status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.logger import logger

from .models import Game, User
from .permissions import IsPlayerOrReadOnly
from .serializers import (
    FriendSerializer,
    GameSerializer,
    LoginSerializer,
    UserAvatarSerializer,
    UserSerializer,
)


class HealthCheckView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        logger.info("HealthCheck endpoint accessed")
        return Response({"status": "ok"})


class UserListCreateView(generics.ListCreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    # permission_classes = [IsAuthenticated]
    # debug purpose
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response(
            {
                "user": UserSerializer(
                    user, context=self.get_serializer_context()
                ).data,
                "message": "User created successfully",
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        if Token.objects.filter(user=user).exists():
            return Response(
                {"message": "このアカウントは既にログインしています。"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # トークンが存在しなければ新規発行
        token = Token.objects.get_or_create(user=user)
        # token, created = Token.objects.get_or_create(user=user)
        return Response(
            {
                "message": "Login Success",
                "token": token.key,
                "user_id": user.id,
                "username": user.username,
            }
        )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response({"message": "Logout successful"})


class UserRetrieveUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserAvatarUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = UserAvatarSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class UpdateUserImageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        user.avatar = request.data["avatar"]
        user.save()

        return Response(
            {"message": "Avatar updated successfully", "avatar": user.avatar}
        )

    def delete(self, request):
        user = request.user
        user.avatar = "default_avatar.png"
        user.save()

        return Response(
            {"message": "Avatar deleted successfully", "avatar": user.avatar}
        )

    def get(self, request):
        user = request.user
        return Response({"avatar": user.avatar})

    def put(self, request):
        user = request.user
        user.avatar = request.data["avatar"]
        user.save()

        return Response(
            {"message": "Avatar updated successfully", "avatar": user.avatar}
        )


class UpdateUserInfoView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        user = request.user
        user.display_name = request.data["display_name"]
        user.email = request.data["email"]
        user.save()

        return Response(
            {
                "message": "User info updated successfully",
                "display_name": user.display_name,
                "email": user.email,
            }
        )

    def get(self, request):
        user = request.user
        return Response({"display_name": user.display_name, "email": user.email})


class FriendListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        pk = kwargs.get("pk")
        if pk is not None and pk != request.user.id:
            return Response(
                {"error": "You cannot view other users' friend lists."},
                status=status.HTTP_403_FORBIDDEN,
            )
        friends = request.user.friends.all()
        serializer = FriendSerializer(friends, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class AddFriendView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        pk = kwargs.get("pk")
        if pk is not None and pk != request.user.id:
            return Response(
                {"error": "You cannot add friends to other users."},
                status=status.HTTP_403_FORBIDDEN,
            )
        username = request.data.get("username", "").strip()
        if not username:
            return Response(
                {"error": "Username is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            friend = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if friend == request.user:
            return Response(
                {"error": "You cannot add yourself as a friend"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if friend in request.user.friends.all():
            return Response(
                {"error": "User is already your friend"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        request.user.friends.add(friend)

        serializer = FriendSerializer(friend, context={"request": request})
        return Response(
            {"message": "Friend added successfully", "friend": serializer.data},
            status=status.HTTP_201_CREATED,
        )


class RemoveFriendView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, friend_id, *args, **kwargs):
        pk = kwargs.get("pk")
        if pk is not None and pk != request.user.id:
            return Response(
                {"error": "You cannot remove friends from other users."},
                status=status.HTTP_403_FORBIDDEN,
            )
        try:
            friend = User.objects.get(id=friend_id)
        except User.DoesNotExist:
            return Response(
                {"error": "Friend not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if friend not in request.user.friends.all():
            return Response(
                {"error": "User is not your friend"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        request.user.friends.remove(friend)
        return Response(
            {"message": "Friend removed successfully"},
            status=status.HTTP_200_OK,
        )


class GameListCreateView(generics.ListCreateAPIView):
    queryset = Game.objects.all()
    serializer_class = GameSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        game = serializer.save()

        return Response(
            {
                "game": GameSerializer(
                    game, context=self.get_serializer_context()
                ).data,
                "message": "Game created successfully",
            },
            status=status.HTTP_201_CREATED,
        )


class GameRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Game.objects.all()
    serializer_class = GameSerializer
    permission_classes = [IsAuthenticated, IsPlayerOrReadOnly]


# TODO: class TournamentListCreateView(generics.ListCreateAPIView):
