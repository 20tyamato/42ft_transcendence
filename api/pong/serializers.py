from rest_framework import serializers
from .models import User, Game, Tournament, BlockchainScore
from django.contrib.auth import authenticate

class UserSerializer(serializers.ModelSerializer):
    # パスワードはUserモデル内で管理しない
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
        print("Creating user with data:", validated_data)  # デバッグログ
        
        validated_data.pop('password2', None)
        
        try:
            user = User.objects.create(
                username=validated_data['username'],
                email=validated_data.get('email', ''),
                display_name=validated_data['display_name']
            )
            user.set_password(validated_data['password'])
            user.save()
            print("User created successfully:", user.id)  # デバッグログ
            return user
        except Exception as e:
            print("Error creating user:", str(e))  # エラーログ
            raise

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
