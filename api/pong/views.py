from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import User, Game, Tournament, BlockchainScore
from .serializers import UserSerializer, GameSerializer, TournamentSerializer, BlockchainScoreSerializer
from .permissions import IsOwnerOfUserProfile, IsPlayerOrReadOnly, IsOwnerOfTournament, IsOwnerOfBlockchainScore
from rest_framework.permissions import AllowAny

class UserListCreateView(generics.ListCreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

class UserRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    permission_classes = [IsAuthenticated, IsOwnerOfUserProfile]


class GameListCreateView(generics.ListCreateAPIView):
    queryset = Game.objects.all()
    serializer_class = GameSerializer
    permission_classes = [IsAuthenticated]

class GameRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Game.objects.all()
    serializer_class = GameSerializer
    permission_classes = [IsAuthenticated, IsPlayerOrReadOnly]

class TournamentListCreateView(generics.ListCreateAPIView):
    queryset = Tournament.objects.all()
    serializer_class = TournamentSerializer
    permission_classes = [IsAuthenticated]


class TournamentRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Tournament.objects.all()
    serializer_class = TournamentSerializer
    permission_classes = [IsAuthenticated, IsOwnerOfTournament]


class BlockchainScoreListCreateView(generics.ListCreateAPIView):
    queryset = BlockchainScore.objects.all()
    serializer_class = BlockchainScoreSerializer
    permission_classes = [IsAuthenticated]


class BlockchainScoreRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = BlockchainScore.objects.all()
    serializer_class = BlockchainScoreSerializer
    permission_classes = [IsAuthenticated, IsOwnerOfBlockchainScore]
