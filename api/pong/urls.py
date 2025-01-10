from django.urls import path
from .views import (
    UserListCreateView, UserRetrieveUpdateDestroyView,
    GameListCreateView, GameRetrieveUpdateDestroyView
)

urlpatterns = [
    # User
    path('users/', UserListCreateView.as_view(), name='user-list-create'),
    path('users/<int:pk>/', UserRetrieveUpdateDestroyView.as_view(), name='user-detail'),

    # Game
    path('games/', GameListCreateView.as_view(), name='game-list-create'),
    path('games/<int:pk>/', GameRetrieveUpdateDestroyView.as_view(), name='game-detail'),
]
