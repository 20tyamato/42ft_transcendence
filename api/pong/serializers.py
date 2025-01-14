from rest_framework import serializers
from .models import User, Game, Tournament, BlockchainScore
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

# TODO: ここ追加する
class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    password2 = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'display_name',
            'password',
            'password2'
        ]
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        
        try:
            validate_password(attrs['password'])
        except ValidationError as e:
            raise serializers.ValidationError({"password": list(e.messages)})
        
        return attrs

    def create(self, validated_data):
        # Remove password2 as we don't need it for user creation
        validated_data.pop('password2', None)

        # Create user instance but don't save it yet
        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            display_name=validate_data['display_name']
        )

        # Set password (this handles the hashing)
        user.set_password(validated_data['password'])
        user.save()

        return user

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
