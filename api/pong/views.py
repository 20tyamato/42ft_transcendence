from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.logger import logger

from .models import Game, User
from .permissions import IsPlayerOrReadOnly
from .serializers import (
    FriendSerializer,
    GameSerializer,
    UserAvatarSerializer,
    UserSerializer,
)


class HealthCheckView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        logger.info("HealthCheck endpoint accessed")
        return Response({"status": "ok"}, status=status.HTTP_200_OK)


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

    def patch(self, request):
        user = request.user
        if "avatar" not in request.FILES:
            return Response(
                {"error": "アバター画像が提供されていません。"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        avatar_file = request.FILES["avatar"]

        # 画像ファイルの検証
        if not avatar_file.content_type.startswith("image/"):
            return Response(
                {"error": "アップロードされたファイルは画像ではありません。"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 画像サイズの制限（例：5MB）
        if avatar_file.size > 5 * 1024 * 1024:
            return Response(
                {"error": "画像サイズは5MB以下にしてください。"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.avatar = avatar_file
        user.save()

        serializer = self.get_serializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserAvatarRetrieveView(generics.RetrieveAPIView):
    serializer_class = UserAvatarSerializer
    permission_classes = [AllowAny]

    def get_object(self):
        username = self.kwargs.get("username")
        return get_object_or_404(User, username=username)


class UpdateUserImageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        user.avatar = request.data["avatar"]
        user.save()

        return Response(
            {"message": "Avatar updated successfully", "avatar": user.avatar},
            status=status.HTTP_201_CREATED,
        )

    def delete(self, request):
        user = request.user
        user.avatar = "default_avatar.png"
        user.save()

        return Response(
            {"message": "Avatar deleted successfully", "avatar": user.avatar},
            status=status.HTTP_200_OK,
        )

    def get(self, request):
        user = request.user
        return Response({"avatar": user.avatar}, status=status.HTTP_200_OK)

    def put(self, request):
        user = request.user
        user.avatar = request.data["avatar"]
        user.save()

        return Response(
            {"message": "Avatar updated successfully", "avatar": user.avatar},
            status=status.HTTP_201_CREATED,
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
            },
            status=201,
        )

    def get(self, request):
        user = request.user
        return Response(
            {"display_name": user.display_name, "email": user.email},
            status=status.HTTP_200_OK,
        )


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
