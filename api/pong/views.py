from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import User, Game, Tournament, BlockchainScore
from .serializers import UserSerializer, LoginSerializer, GameSerializer, TournamentSerializer, BlockchainScoreSerializer, UserAvatarSerializer
from .permissions import IsOwnerOfUserProfile, IsPlayerOrReadOnly, IsOwnerOfTournament, IsOwnerOfBlockchainScore
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.views import APIView

class HealthCheckView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({'status': 'ok'})

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

class UpdateUserImageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        user.avatar = request.data['avatar']
        user.save()

        return Response({
            'message': 'Avatar updated successfully',
            'avatar': user.avatar
        })

    def delete(self, request):
        user = request.user
        user.avatar = 'default_avatar.png'
        user.save()

        return Response({
            'message': 'Avatar deleted successfully',
            'avatar': user.avatar
        })

    def get(self, request):
        user = request.user
        return Response({
            'avatar': user.avatar
        })

    def put(self, request):
        user = request.user
        user.avatar = request.data['avatar']
        user.save()

        return Response({
            'message': 'Avatar updated successfully',
            'avatar': user.avatar
        })

class UpdateUserInfoView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        user = request.user
        user.display_name = request.data['display_name']
        user.email = request.data['email']
        user.save()

        return Response({
            'message': 'User info updated successfully',
            'display_name': user.display_name,
            'email': user.email
        })

    def get(self, request):
        user = request.user
        return Response({
            'display_name': user.display_name,
            'email': user.email
        })


class GameListCreateView(generics.ListCreateAPIView):
    queryset = Game.objects.all()
    serializer_class = GameSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        game = serializer.save()

        return Response({
            'game': GameSerializer(game, context=self.get_serializer_context()).data,
            'message': 'Game created successfully'
        }, status=status.HTTP_201_CREATED)

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
