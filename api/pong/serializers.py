from rest_framework import serializers
from .models import User, Game

class UserSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'display_name',
            'avatar',
            'level',
        ]


class GameSerializer(serializers.ModelSerializer):
    player1 = UserSimpleSerializer(read_only=True)
    player2 = UserSimpleSerializer(read_only=True)
    winner = UserSimpleSerializer(read_only=True)

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
