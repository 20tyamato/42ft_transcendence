from rest_framework import serializers
from .models import User, Game, Tournament, BlockchainScore

# TODO: ここ追加する
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'display_name',
        ]


class GameSerializer(serializers.ModelSerializer):
    player1 = UserSerializer(read_only=True)
    player2 = UserSerializer(read_only=True)
    winner = UserSerializer(read_only=True)

    class Meta:
        model = Game
        fields = [
            'id',
            'player1',
            'player2',
            'start_time',
            'end_time',
            'winner',
            'score_player1',
            'score_player2',
            'is_ai_opponent',
        ]

class TournamentSerializer(serializers.ModelSerializer):
    participants = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=User.objects.all()
    )
    games = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Game.objects.all()
    )

    class Meta:
        model = Tournament
        fields = [
            'id',
            'name',
            'created_at',
            'participants',
            'games',
            'blockchain_score_hash',
        ]


class BlockchainScoreSerializer(serializers.ModelSerializer):
    tournament = serializers.PrimaryKeyRelatedField(
        queryset=Tournament.objects.all()
    )

    class Meta:
        model = BlockchainScore
        fields = [
            'id',
            'tournament',
            'transaction_id',
            'blockchain_address',
            'created_at',
        ]
