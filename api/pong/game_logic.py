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
        self._scoring_in_progress = False  # 同一フレームの二重得点防止

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
                    "z": self.FIELD_LENGTH / 2 - self.PADDLE_Z_OFFSET,
                },
                self.player2_name: {
                    "x": self.paddles[self.player2_name],
                    "z": -(self.FIELD_LENGTH / 2 - self.PADDLE_Z_OFFSET),
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

    PADDLE_DEPTH = 20   # パドルの厚さ（Z方向）
    PADDLE_Z_OFFSET = 200  # パドルを得点ラインより手前に配置するオフセット

    # 以下、プライベートメソッド
    def _handle_wall_collision(self) -> None:
        if abs(self.ball.x) > self.FIELD_WIDTH / 2:
            self.ball_velocity.x *= -1
            self.ball.x = (self.FIELD_WIDTH / 2) * (1 if self.ball.x > 0 else -1)

    def _handle_paddle_collision(self) -> None:
        """CCD（連続衝突判定）でパドルとの衝突を処理"""
        paddle_z = self.FIELD_LENGTH / 2 - self.PADDLE_Z_OFFSET

        for username, paddle_x in self.paddles.items():
            is_player1 = username == self.player1_name
            pz = paddle_z if is_player1 else -paddle_z

            if not self._check_paddle_hit(paddle_x, pz):
                continue

            # 方向ガード: パドルに向かって動いている場合のみ反射
            moving_toward = (
                (is_player1 and self.ball_velocity.z > 0) or
                (not is_player1 and self.ball_velocity.z < 0)
            )
            if not moving_toward:
                continue

            # 反射してX成分に角度を付ける
            self.ball_velocity.z *= -1
            self.ball_velocity.x += (self.ball.x - paddle_x) * 0.1

            # 速度X成分の上限（無限加速防止）
            max_vx = abs(self.ball_velocity.z) * 1.5
            self.ball_velocity.x = max(-max_vx, min(max_vx, self.ball_velocity.x))

            # ボールをパドル手前に押し出してめり込み防止
            safe_z = pz - (self.BALL_RADIUS + self.PADDLE_DEPTH / 2 + 1)
            self.ball.z = safe_z if is_player1 else -safe_z

    def _check_paddle_hit(self, paddle_x: float, paddle_z: float) -> bool:
        """パドルとボールの衝突を判定（ボール半径を考慮した広めのゾーン）"""
        # X: ボール半径を含む横幅チェック
        hit_x = (
            self.ball.x + self.BALL_RADIUS > paddle_x - self.PADDLE_WIDTH / 2
            and self.ball.x - self.BALL_RADIUS < paddle_x + self.PADDLE_WIDTH / 2
        )
        if not hit_x:
            return False

        # Z: パドル厚さの半分 + ボール半径を衝突ゾーンとする
        half_zone = self.PADDLE_DEPTH / 2 + self.BALL_RADIUS
        hit_z = abs(self.ball.z - paddle_z) < half_zone
        return hit_z

    def _check_scoring(self) -> None:
        if self._scoring_in_progress:
            return
        if abs(self.ball.z) > self.FIELD_LENGTH / 2:
            self._scoring_in_progress = True
            scoring_player = self.player1_name if self.ball.z < 0 else self.player2_name
            self.score[scoring_player] += 1

            if max(self.score.values()) >= self.WINNING_SCORE:
                self.is_active = False
            else:
                self._reset_ball()
                self._scoring_in_progress = False

    def _reset_ball(self) -> None:
        self.ball = Vector3D(0, 30, 0)
        self.ball_velocity = Vector3D(
            self.INITIAL_BALL_SPEED * random.choice([-1, 1]),
            0,
            -self.INITIAL_BALL_SPEED * random.choice([-1, 1]),
        )
