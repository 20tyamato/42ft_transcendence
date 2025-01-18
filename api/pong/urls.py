from django.urls import path
from .views import (
    UserListCreateView, UserRetrieveUpdateDestroyView,
    GameListCreateView, GameRetrieveUpdateDestroyView,
    TournamentListCreateView, TournamentRetrieveUpdateDestroyView,
    BlockchainScoreListCreateView, BlockchainScoreRetrieveUpdateDestroyView,
    LoginView
)

app_name = "pong"
urlpatterns = [
    # User
    path('users/', UserListCreateView.as_view(), name='user-list-create'),
    path('users/<int:pk>/', UserRetrieveUpdateDestroyView.as_view(), name='user-detail'),

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
