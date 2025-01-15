from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import User, Game, Tournament, BlockchainScore
from .serializers import UserSerializer, LoginSerializer, GameSerializer, TournamentSerializer, BlockchainScoreSerializer
from .permissions import IsOwnerOfUserProfile, IsPlayerOrReadOnly, IsOwnerOfTournament, IsOwnerOfBlockchainScore
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.views import APIView

class UserListCreateView(generics.ListCreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response({
            'user': UserSerializer(user, context=self.get_serializer_context()).data,
            'message': 'User created successfully'
        }, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    serializer_class = LoginSerializer
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'token': token.key,
            'user_id': user.id,
            'username': user.username
        })

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
