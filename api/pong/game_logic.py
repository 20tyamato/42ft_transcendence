# game_logic.py
from dataclasses import dataclass
import random
from typing import Dict, Optional
from django.utils import timezone


@dataclass
class Vector3D:
    x: float
    y: float
    z: float


class BaseGameLogic:
    """全ゲームタイプの基底となるゲームロジック"""

    # 共通定数
    FIELD_WIDTH = 1200
    FIELD_LENGTH = 3000
    PADDLE_WIDTH = 200
    BALL_RADIUS = 30
    INITIAL_BALL_SPEED = 300
    # FIXME: need to adjust
    PADDLE_SPEED = 50
    # FIXME: for develop. it must be 15
    WINNING_SCORE = 3

    def __init__(self, session_id: str):
        """基本初期化処理"""
        self.session_id = session_id
        self.is_active = True
        self.db_game_id = None
        self.last_update = timezone.now()

    def update(self, delta_time: float) -> Dict:
        """ゲーム状態更新の基本実装"""
        if not self.is_active:
            return self.get_state()

        # サブクラスで具体的な更新処理を実装
        return self.get_state()

    def move_player(self, username: str, new_x: float) -> None:
        """プレイヤー移動の基本実装"""
        # サブクラスで実装
        pass

    def handle_disconnection(self, disconnected_player: str) -> None:
        """プレイヤー切断の基本処理"""
        # サブクラスで実装
        pass

    def get_state(self) -> dict:
        """現在のゲーム状態を取得"""
        # サブクラスで実装
        return {}

    def get_winner(self) -> Optional[str]:
        """勝者の取得"""
        # サブクラスで実装
        return None


class MultiplayerPongGame(BaseGameLogic):
    """2プレイヤー向けゲームロジック"""

    def __init__(self, session_id: str, player1_name: str, player2_name: str):
        """マルチプレイヤー固有の初期化"""
        super().__init__(session_id)
        self.player1_name = player1_name
        self.player2_name = player2_name

        # ゲーム状態の初期化
        self.ball = Vector3D(0, 30, 0)
        self.ball_velocity = Vector3D(
            self.INITIAL_BALL_SPEED, 0, -self.INITIAL_BALL_SPEED
        )
        self.paddles = {
            player1_name: 0,  # X座標のみ保持
            player2_name: 0,
        }
        self.score = {player1_name: 0, player2_name: 0}

    def update(self, delta_time: float) -> Dict:
        """ゲーム状態の更新処理"""
        if not self.is_active:
            return self.get_state()

        # ボールの移動
        self.ball.x += self.ball_velocity.x * delta_time
        self.ball.z += self.ball_velocity.z * delta_time

        # 衝突判定と処理
        self._handle_wall_collision()
        self._handle_paddle_collision()
        self._check_scoring()

        return self.get_state()

    def move_player(self, username: str, new_x: float) -> None:
        """プレイヤーの移動を処理"""
        if username not in self.paddles:
            return

        # 移動制限
        max_x = (self.FIELD_WIDTH - self.PADDLE_WIDTH) / 2
        self.paddles[username] = max(min(new_x, max_x), -max_x)

    def get_state(self) -> dict:
        """現在のゲーム状態を辞書形式で返す"""
        return {
            "ball": {
                "position": {"x": self.ball.x, "y": self.ball.y, "z": self.ball.z},
                "velocity": {
                    "x": self.ball_velocity.x,
                    "y": self.ball_velocity.y,
                    "z": self.ball_velocity.z,
                },
            },
            "players": {
                self.player1_name: {
                    "x": self.paddles[self.player1_name],
                    "z": self.FIELD_LENGTH / 2,
                },
                self.player2_name: {
                    "x": self.paddles[self.player2_name],
                    "z": -self.FIELD_LENGTH / 2,
                },
            },
            "score": self.score,
            "is_active": self.is_active,
        }

    def get_winner(self) -> Optional[str]:
        """勝者のusernameを返す"""
        if self.score[self.player1_name] >= self.WINNING_SCORE:
            return self.player1_name
        if self.score[self.player2_name] >= self.WINNING_SCORE:
            return self.player2_name
        return None

    def handle_disconnection(self, disconnected_player: str) -> None:
        """プレイヤーの切断時の処理"""
        # 残ったプレイヤーの勝利が確定するようにスコアを設定
        winning_player = (
            self.player2_name
            if disconnected_player == self.player1_name
            else self.player1_name
        )
        self.score[winning_player] = self.WINNING_SCORE
        self.score[disconnected_player] = 0

        # ゲームを終了状態に
        self.is_active = False

    # 以下、プライベートメソッド
    def _handle_wall_collision(self) -> None:
        if abs(self.ball.x) > self.FIELD_WIDTH / 2:
            self.ball_velocity.x *= -1
            self.ball.x = (self.FIELD_WIDTH / 2) * (1 if self.ball.x > 0 else -1)

    def _handle_paddle_collision(self) -> None:
        paddle_z = self.FIELD_LENGTH / 2

        for username, paddle_x in self.paddles.items():
            if self._check_paddle_hit(
                paddle_x, paddle_z if username == self.player1_name else -paddle_z
            ):
                self.ball_velocity.z *= -1
                self.ball_velocity.x += (self.ball.x - paddle_x) * 0.1

    def _check_paddle_hit(self, paddle_x: float, paddle_z: float) -> bool:
        """パドルとボールの衝突を判定"""
        paddle_half_width = self.PADDLE_WIDTH / 2
        ball_radius = self.BALL_RADIUS

        # パドルのバウンディングボックス
        paddle_bounds = {
            "min_x": paddle_x - paddle_half_width,
            "max_x": paddle_x + paddle_half_width,
            "min_z": paddle_z - 10,  # パドルの厚さ
            "max_z": paddle_z + 10,
        }

        # ボールがパドルの範囲内にあるかチェック
        is_hit = (
            self.ball.x + ball_radius > paddle_bounds["min_x"]
            and self.ball.x - ball_radius < paddle_bounds["max_x"]
            and self.ball.z + ball_radius > paddle_bounds["min_z"]
            and self.ball.z - ball_radius < paddle_bounds["max_z"]
        )

        return is_hit

    def _check_scoring(self) -> None:
        if abs(self.ball.z) > self.FIELD_LENGTH / 2:
            scoring_player = self.player1_name if self.ball.z < 0 else self.player2_name
            self.score[scoring_player] += 1

            if max(self.score.values()) >= self.WINNING_SCORE:
                self.is_active = False
            else:
                self._reset_ball()

    def _reset_ball(self) -> None:
        self.ball = Vector3D(0, 30, 0)
        self.ball_velocity = Vector3D(
            self.INITIAL_BALL_SPEED * random.choice([-1, 1]),
            0,
            -self.INITIAL_BALL_SPEED * random.choice([-1, 1]),
        )


# NOTE: セッションIDの形式：tournament_{tournament_id}_{round_type}_{player1}_{player2}_{timestamp}
class TournamentPongGame(BaseGameLogic):
    """トーナメント向けゲームロジック"""

    def __init__(
        self,
        game_instance_id: str,
        player1_name: str,
        player2_name: str,
        tournament_round: int = 0,
    ):
        """トーナメント固有の初期化処理"""
        return
