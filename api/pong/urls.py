from django.urls import path
from .views import (
    HealthCheckView,
    UserListCreateView, UserRetrieveUpdateDestroyView,
    GameListCreateView, GameRetrieveUpdateDestroyView,
    TournamentListCreateView, TournamentRetrieveUpdateDestroyView,
    BlockchainScoreListCreateView, BlockchainScoreRetrieveUpdateDestroyView,
    UserAvatarUpdateView, CurrentUserRetrieveUpdateView, 
    LoginView
)

app_name = "pong"
urlpatterns = [
    # HealthCheck
    path('healthcheck/', HealthCheckView.as_view(), name='healthcheck'),

    # User
    path('users/', UserListCreateView.as_view(), name='user-list-create'),
    path('users/<int:pk>/', UserRetrieveUpdateDestroyView.as_view(), name='user-detail'),
    path('users/<int:pk>/avatar/', UserRetrieveUpdateDestroyView.as_view(), name='user-avatar'),

    # Current User
    path('users/me/', CurrentUserRetrieveUpdateView.as_view(), name='current-user-detail'),
    path('users/me/avatar/', UserAvatarUpdateView.as_view(), name='current-user-avatar'),

    # Login
    path('login/', LoginView.as_view(), name='login'),

    # Game
    path('games/', GameListCreateView.as_view(), name='game-list-create'),
    path('games/<int:pk>/', GameRetrieveUpdateDestroyView.as_view(), name='game-detail'),

    # Tournament
    path('tournaments/', TournamentListCreateView.as_view(), name='tournament-list-create'),
    path('tournaments/<int:pk>/', TournamentRetrieveUpdateDestroyView.as_view(), name='tournament-detail'),

    # BlockchainScore
    path('blockchain-scores/', BlockchainScoreListCreateView.as_view(), name='blockchainscore-list-create'),
    path('blockchain-scores/<int:pk>/', BlockchainScoreRetrieveUpdateDestroyView.as_view(), name='blockchainscore-detail'),
]
