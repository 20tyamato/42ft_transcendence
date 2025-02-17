from django.urls import path

from .views import (
    GameListCreateView,
    GameRetrieveUpdateDestroyView,
    HealthCheckView,
    LoginView,
    UserAvatarUpdateView,
    UserListCreateView,
    UserRetrieveUpdateView,
)

app_name = "pong"
urlpatterns = [
    # HealthCheck
    path("healthcheck/", HealthCheckView.as_view(), name="healthcheck"),
    # User
    path("users/", UserListCreateView.as_view(), name="user-list-create"),
    path("users/<int:pk>/", UserRetrieveUpdateView.as_view(), name="user-detail"),
    path("users/<int:pk>/avatar/", UserAvatarUpdateView.as_view(), name="user-avatar"),
    path(
        "users/<int:pk>/friends/", UserRetrieveUpdateView.as_view(), name="user-friends"
    ),
    # Current User
    path("users/me/", UserRetrieveUpdateView.as_view(), name="current-user-detail"),
    path(
        "users/me/avatar/", UserAvatarUpdateView.as_view(), name="current-user-avatar"
    ),
    # Login
    path("login/", LoginView.as_view(), name="login"),
    # Game
    path("games/", GameListCreateView.as_view(), name="game-list-create"),
    path(
        "games/<int:pk>/", GameRetrieveUpdateDestroyView.as_view(), name="game-detail"
    ),
    # Tournament
    # TODO: add Tournament frontend
]
