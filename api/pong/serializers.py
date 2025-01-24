from rest_framework import serializers
from .models import User, Game, Tournament, BlockchainScore
from django.contrib.auth import authenticate

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'display_name',
            'password',
        ]
        extra_kwargs = {
            'username': {'required': True},
            'email': {'required': True},
            'display_name': {'required': True},
        }

    def validate(self, attrs):
        # 空文字列のチェック
        for field in ['username', 'email', 'display_name']:
            if field in attrs and not attrs[field].strip():
                raise serializers.ValidationError({field: "This field may not be blank."})

        return super().validate(attrs)

    def create(self, validated_data):
        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            display_name=validated_data['display_name']
        )
        user.set_password(validated_data['password'])
        user.save()
        return user

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        if username and password:
            user = authenticate(username=username, password=password)
            if user:
                if user.is_active:
                    attrs['user'] = user
                    return attrs
                raise serializers.ValidationError('User account is disabled.')
            raise serializers.ValidationError('Unable to log in with provided credentials.')
        raise serializers.ValidationError('Must include "username" and "password".')

class GameSerializer(serializers.ModelSerializer):
    player1 = serializers.CharField(source='player1.username')
    player2 = serializers.CharField(source='player2.username', allow_null=True, required=False, allow_blank=True)
    winner = serializers.CharField(source='winner.username', allow_null=True, required=False, allow_blank=True)

    def validate_player1(self, value):
        """Validate that player1 exists"""
        try:
            User.objects.get(username=value)
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("Player1 does not exist")

    def validate_player2(self, value):
        """Validate player2 if present"""
        if value:
            try:
                User.objects.get(username=value)
                return value
            except User.DoesNotExist:
                raise serializers.ValidationError("Player2 does not exist")
        return value

    def validate(self, data):
        """Validate complete set of data"""
        if not data.get('player1'):
            raise serializers.ValidationError("Player1 is required")

        if data.get('is_ai_opponent') is False:
            if data.get('player2', {}).get('username') is None:
                raise serializers.ValidationError("Player2 is required for non-AI games")

        return data

    def create(self, validated_data):
        player1_data = validated_data.pop('player1')
        player2_data = validated_data.pop('player2')
        # NOTE: Noneはデフォルト値.試合が中断されたときやAI対戦のときを想定
        winner_data = validated_data.pop('winner', None)

        player1 = User.objects.get(username=player1_data['username'])

        if player2_data['username'] is None:
            validated_data['player2'] = None
        else:
            validated_data['player2'] = User.objects.get(username=player2_data['username'])

        # NOTE: 空欄もありえるので.今後の要件で変更あるかも.
        if winner_data and winner_data['username']:
            validated_data['winner'] = User.objects.get(username=winner_data['username'])
        else:
            validated_data['winner'] = None

        game = Game.objects.create(player1=player1, **validated_data)
        return game

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
