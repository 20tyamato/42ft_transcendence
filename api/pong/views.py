from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth import get_user_model

from .models import User, Game, Tournament, BlockchainScore
from .serializers import (
    UserSerializer,
    LoginSerializer,
    GameSerializer,
    TournamentSerializer,
    BlockchainScoreSerializer,
)
from .permissions import (
    IsOwnerOfUserProfile,
    IsPlayerOrReadOnly,
    IsOwnerOfTournament,
    IsOwnerOfBlockchainScore,
)


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
    permission_classes = [AllowAny]

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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_single_game(request):
    """AI対戦用Gameを作成するエンドポイント"""
    User = get_user_model()
    level = request.data.get('level', 'Easy')
    user = request.user

    # AI対戦用の仮ユーザーを用意
    try:
        ai_user = User.objects.get(username='ai_user')
    except User.DoesNotExist:
        ai_user = User.objects.create_user(
            username='ai_user',
            password='some_secure_password',
            display_name='AI Opponent'
        )

    # Gameオブジェクト作成
    game = Game.objects.create(
        player1=user,
        player2=ai_user,
        is_ai_opponent=True
    )
    # 必要に応じて level の情報を使って初期設定を変更するなど

    return Response({'game_id': game.id})


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
