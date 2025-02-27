from django.contrib.auth import authenticate
from rest_framework import serializers

import time
from .models import Game, User, TournamentSession, TournamentParticipant


class FriendSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "is_online")


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "display_name",
            "password",
            "avatar",
            "level",
            "experience",
            "language",
            "is_online",
            "friends",
        ]
        extra_kwargs = {
            "username": {"required": True},
            "email": {"required": True},
            "display_name": {"required": True},
        }

    def validate(self, attrs):
        for field in ["username", "email", "display_name"]:
            if field in attrs and not attrs[field].strip():
                raise serializers.ValidationError(
                    {field: "This field may not be blank."}
                )
        return super().validate(attrs)

    def create(self, validated_data):
        user = User.objects.create(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            display_name=validated_data["display_name"],
            avatar=validated_data.get("avatar", ""),
            level=validated_data.get("level", 1),
            experience=validated_data.get("experience", 0),
            language=validated_data.get("language", "en"),
            is_online=validated_data.get("is_online", False),
        )
        user.set_password(validated_data["password"])
        user.save()
        return user


class UserAvatarSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = ["avatar", "avatar_url"]

    def get_avatar_url(self, obj):
        request = self.context.get("request")
        if obj.avatar and hasattr(obj.avatar, "url"):
            # 絶対パスにする場合は request.build_absolute_uri を利用
            return (
                request.build_absolute_uri(obj.avatar.url)
                if request
                else obj.avatar.url
            )
        return None


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        username = attrs.get("username")
        password = attrs.get("password")

        if username and password:
            user = authenticate(username=username, password=password)
            if user:
                if user.is_active:
                    attrs["user"] = user
                    return attrs
                raise serializers.ValidationError("User account is disabled.")
            raise serializers.ValidationError(
                "Unable to log in with provided credentials."
            )
        raise serializers.ValidationError('Must include "username" and "password".')


class GameSerializer(serializers.ModelSerializer):
    player1 = serializers.CharField(source="player1.username")
    player2 = serializers.CharField(
        source="player2.username", allow_null=True, required=False, allow_blank=True
    )
    winner = serializers.CharField(
        source="winner.username", allow_null=True, required=False, allow_blank=True
    )
    tournament_id = serializers.PrimaryKeyRelatedField(
        source='tournament', queryset=TournamentSession.objects.all(), 
        required=False, allow_null=True
    )

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
        if not data.get("player1"):
            raise serializers.ValidationError("Player1 is required")

        # ゲームタイプに基づくバリデーション
        game_type = data.get("game_type", "MULTI")  # デフォルトはマルチプレイヤー
        
        # マルチプレイまたはトーナメントの場合、AIでない限りplayer2が必要
        if game_type in ['MULTI', 'TOURNAMENT'] and data.get("is_ai_opponent") is False:
            if data.get("player2", {}).get("username") is None:
                raise serializers.ValidationError(
                    "Player2 is required for non-AI multiplayer games"
                )
                
        # トーナメントの場合、tournament_idが必要
        if game_type == 'TOURNAMENT' and not data.get("tournament"):
            raise serializers.ValidationError(
                "Tournament reference is required for tournament games"
            )
            
        return data

    def create(self, validated_data):
        player1_data = validated_data.pop("player1")
        player2_data = validated_data.pop("player2", {"username": None})
        winner_data = validated_data.pop("winner", None)

        player1 = User.objects.get(username=player1_data["username"])

        if not player2_data or player2_data.get("username") is None:
            validated_data["player2"] = None
        else:
            validated_data["player2"] = User.objects.get(
                username=player2_data["username"]
            )

        if winner_data and winner_data.get("username"):
            validated_data["winner"] = User.objects.get(
                username=winner_data["username"]
            )
        else:
            validated_data["winner"] = None

        # セッションIDが指定されていない場合は自動生成
        if "session_id" not in validated_data:
            # game_type + player1 username + timestamp をベースにセッションID生成
            timestamp = int(time.time())
            game_type = validated_data.get("game_type", "MULTI")
            player2_name = "ai" if validated_data.get("is_ai_opponent") else (
                validated_data["player2"].username if validated_data.get("player2") else "solo"
            )
            validated_data["session_id"] = f"{game_type.lower()}_{player1.username}_{player2_name}_{timestamp}"

        game = Game.objects.create(player1=player1, **validated_data)
        return game

    class Meta:
        model = Game
        fields = [
            "id",
            "game_type",
            "status",
            "session_id",
            "player1",
            "player2",
            "created_at",
            "ended_at",
            "winner",
            "score_player1",
            "score_player2",
            "is_ai_opponent",
            "tournament_id",
            "tournament_round",
        ]
        read_only_fields = ["id", "created_at"]


class TournamentParticipantSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    display_name = serializers.CharField(source="user.display_name", read_only=True)

    class Meta:
        model = TournamentParticipant
        fields = [
            "id",
            "username",
            "display_name",
            "is_ready",
            "joined_at",
            "bracket_position",
        ]


class TournamentSessionSerializer(serializers.ModelSerializer):
    participants = TournamentParticipantSerializer(many=True, read_only=True)
    current_players_count = serializers.SerializerMethodField()
    games = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    class Meta:
        model = TournamentSession
        fields = [
            "id",
            "status",
            "created_at",
            "started_at",
            "completed_at",
            "max_players",
            "current_players_count",
            "participants",
            "games",
        ]

    def get_current_players_count(self, obj):
        return obj.participants.count()

    def validate(self, data):
        if self.instance and self.instance.status != "WAITING_PLAYERS":
            raise serializers.ValidationError(
                "Cannot modify tournament after it has started"
            )
        return data