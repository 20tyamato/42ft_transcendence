from django.urls import path

from .modules.Auth.views import LoginView, LogoutView
from .views import (
    AddFriendView,
    FriendListView,
    GameListCreateView,
    GameRetrieveUpdateDestroyView,
    HealthCheckView,
    RemoveFriendView,
    UserAvatarRetrieveView,
    UserAvatarUpdateView,
    UserListCreateView,
    UserRetrieveUpdateView,
    UserMatchHistoryView,
)

app_name = "pong"
urlpatterns = [
    # HealthCheck
    path("healthcheck/", HealthCheckView.as_view(), name="healthcheck"),
    # User
    path("users/", UserListCreateView.as_view(), name="user-list-create"),
    path("users/<int:pk>/", UserRetrieveUpdateView.as_view(), name="user-detail"),
    path("users/<int:pk>/avatar/", UserAvatarUpdateView.as_view(), name="user-avatar"),
    path("users/<int:pk>/friends/", FriendListView.as_view(), name="friend-list"),
    path("users/<int:pk>/friends/add/", AddFriendView.as_view(), name="friend-add"),
    path(
        "users/<int:pk>/friends/<int:friend_id>/",
        RemoveFriendView.as_view(),
        name="friend-remove",
    ),
    # Current User
    path("users/me/", UserRetrieveUpdateView.as_view(), name="current-user-detail"),
    path(
        "users/me/avatar/", UserAvatarUpdateView.as_view(), name="current-user-avatar"
    ),
    path("users/me/friends/", FriendListView.as_view(), name="friend-list"),
    path("users/me/friends/add/", AddFriendView.as_view(), name="friend-add"),
    path(
        "users/me/friends/<int:friend_id>/",
        RemoveFriendView.as_view(),
        name="friend-remove",
    ),
    # usernameを利用してアバター画像を取得するパターン
    path(
        "users/<str:username>/avatar/",
        UserAvatarRetrieveView.as_view(),
        name="user-avatar-username",
    ),
    # Login
    path("login/", LoginView.as_view(), name="login"),
    # Logout
    path("logout/", LogoutView.as_view(), name="logout"),
    # Game
    path("games/", GameListCreateView.as_view(), name="game-list-create"),
    path(
        "games/<int:pk>/", GameRetrieveUpdateDestroyView.as_view(), name="game-detail"
    ),
    # マッチ履歴エンドポイント
    path(
        "users/<int:pk>/matches/", UserMatchHistoryView.as_view(), name="user-matches"
    ),
    path("users/me/matches/", UserMatchHistoryView.as_view(), name="my-matches"),
]
