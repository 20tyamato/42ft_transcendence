from django.contrib.auth import authenticate
from django.db import transaction
from rest_framework import serializers

import time
import uuid
from .models import Game, User, TournamentSession, TournamentParticipant


def generate_session_id(game_type, player1_username, player2_username=None):
    """一貫性のあるセッションIDを生成"""
    # マルチプレイヤーの場合はプレイヤー名をソート
    if player2_username and game_type.lower() == 'multi':
        players = sorted([player1_username, player2_username])
        player_part = f"{players[0]}_{players[1]}"
    else:
        # シングルプレイヤー/AI対戦の場合
        player_part = f"{player1_username}_{'solo' if not player2_username else player2_username}"
    
    # UUIDとタイムスタンプで一意性確保
    unique_id = str(uuid.uuid4())[:8]  # UUIDの一部を使用
    timestamp = int(time.time())
    
    return f"{game_type.lower()}_{player_part}_{unique_id}_{timestamp}"

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
        source="tournament",
        queryset=TournamentSession.objects.all(),
        required=False,
        allow_null=True,
    )
    # クライアントからセッションIDを受け取れるように変更
    session_id = serializers.CharField(required=False)

    class Meta:
        model = Game
        fields = [
            "id",
            "game_type",
            "status",
            "session_id",
            "player1",
            "player2",
            "start_time",
            "end_time",
            "winner",
            "score_player1",
            "score_player2",
            "is_ai_opponent",
            "tournament_id",
            "tournament_round",
        ]
        read_only_fields = ["id", "start_time"]

    def create(self, validated_data):
        player1_data = validated_data.pop("player1")
        player2_data = validated_data.pop("player2", {"username": None})
        winner_data = validated_data.pop("winner", None)
        
        # ユーザーオブジェクトの取得
        player1 = User.objects.get(username=player1_data["username"])
        player2_username = None
        
        if not player2_data or player2_data.get("username") is None:
            validated_data["player2"] = None
        else:
            player2_username = player2_data["username"]
            validated_data["player2"] = User.objects.get(username=player2_username)
        
        if winner_data and winner_data.get("username"):
            validated_data["winner"] = User.objects.get(username=winner_data["username"])
        else:
            validated_data["winner"] = None
        
        # ゲームタイプの取得
        game_type = validated_data.get("game_type", "MULTI")
        
        # クライアントから提供されたセッションIDがあるか確認
        client_session_id = self.initial_data.get("session_id")
        
        # トランザクションで一貫性を確保
        with transaction.atomic():
            # 既存ゲームの検索とアップデート
            if client_session_id:
                try:
                    existing_game = Game.objects.select_for_update().get(session_id=client_session_id)
                    
                    # 既存ゲームのアップデート - 変更可能なフィールドのみ
                    updateable_fields = [
                        "status", "score_player1", "score_player2", "end_time", "winner"
                    ]
                    
                    for field in updateable_fields:
                        if field in validated_data:
                            setattr(existing_game, field, validated_data[field])
                    
                    existing_game.save()
                    return existing_game
                
                except Game.DoesNotExist:
                    # セッションIDが提供されたがゲームが見つからない場合
                    pass
            
            # 新規ゲームの作成
            if "session_id" not in validated_data:
                validated_data["session_id"] = generate_session_id(
                    game_type, player1.username, player2_username
                )
            
            game = Game.objects.create(player1=player1, **validated_data)
            return game

    def update(self, instance, validated_data):
        """既存ゲームインスタンスの更新"""
        # 更新可能なフィールド
        updatable_fields = [
            "score_player1", "score_player2", "status", "end_time", "is_ai_opponent"
        ]
        
        # winner特別処理
        if "winner" in validated_data:
            winner_data = validated_data.pop("winner")
            if winner_data and winner_data.get("username"):
                instance.winner = User.objects.get(username=winner_data["username"])
            else:
                instance.winner = None
        
        # その他のフィールド更新
        for field in updatable_fields:
            if field in validated_data:
                setattr(instance, field, validated_data[field])
        
        instance.save()
        return instance


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
    winner_username = serializers.SerializerMethodField(read_only=True)
    winner_display_name = serializers.SerializerMethodField(read_only=True)

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
            "winner",  # 優勝者ID
            "winner_username",  # 優勝者のユーザー名
            "winner_display_name",  # 優勝者の表示名
        ]

    def get_current_players_count(self, obj):
        return obj.participants.count()

    def get_winner_username(self, obj):
        """優勝者のユーザー名を返す"""
        if obj.winner:
            return obj.winner.username
        return None

    def get_winner_display_name(self, obj):
        """優勝者の表示名を返す"""
        if obj.winner:
            return obj.winner.display_name
        return None

    def validate(self, data):
        if self.instance and self.instance.status != "WAITING_PLAYERS":
            raise serializers.ValidationError(
                "Cannot modify tournament after it has started"
            )
        return data
