from django.urls import path
from . import views

urlpatterns = [
    path('users/', views.UserListCreateView.as_view(), name='user-list-create'),
    path('users/<int:pk>/', views.UserRetrieveUpdateDestroyView.as_view(), name='user-detail'),
    path('games/', views.GameListCreateView.as_view(), name='game-list-create'),
    path('games/<int:pk>/', views.GameRetrieveUpdateDestroyView.as_view(), name='game-detail'),
]
