# api/pong/game_logic.py
from typing import Optional, Dict
from dataclasses import dataclass
from django.utils import timezone
from .models import Game

@dataclass
class Vector3D:
    x: float
    y: float
    z: float

class MultiplayerPongGame:
    FIELD_WIDTH = 1200
    FIELD_LENGTH = 3000
    PADDLE_WIDTH = 200
    BALL_RADIUS = 30
    INITIAL_BALL_SPEED = 15
    PADDLE_SPEED = 10
    WINNING_SCORE = 15

    def __init__(self, game_id: str, player1_name: str, player2_name: str):
        self.game_id = game_id
        self.player1_name = player1_name
        self.player2_name = player2_name
        
        # ゲーム状態の初期化
        self.ball = Vector3D(0, 30, 0)
        self.ball_velocity = Vector3D(
            self.INITIAL_BALL_SPEED, 
            0, 
            -self.INITIAL_BALL_SPEED
        )
        self.paddles = {
            player1_name: 0,  # X座標のみ保持
            player2_name: 0
        }
        self.score = {
            player1_name: 0,
            player2_name: 0
        }
        self.is_active = True
        self.last_update = timezone.now()

    def update(self, delta_time: float) -> Dict:
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

    def get_state_for_player(self, username: str) -> Dict:
        """プレイヤーの視点に応じたゲーム状態を返す"""
        base_state = self.get_state()
        
        # player2の場合は座標を反転
        if username == self.player2_name:
            base_state['ball']['position']['z'] *= -1
            base_state['ball']['velocity']['z'] *= -1
            
            # パドルの位置情報を視点に合わせて調整
            base_state['players'] = {
                self.player2_name: {'x': self.paddles[self.player2_name], 'z': -self.FIELD_LENGTH/2},
                self.player1_name: {'x': self.paddles[self.player1_name], 'z': self.FIELD_LENGTH/2}
            }
        else:
            base_state['players'] = {
                self.player1_name: {'x': self.paddles[self.player1_name], 'z': self.FIELD_LENGTH/2},
                self.player2_name: {'x': self.paddles[self.player2_name], 'z': -self.FIELD_LENGTH/2}
            }

        return base_state

    def move_player(self, username: str, new_x: float) -> None:
        """プレイヤーの移動を処理"""
        if username not in self.paddles:
            return
            
        # 移動制限
        max_x = (self.FIELD_WIDTH - self.PADDLE_WIDTH) / 2
        self.paddles[username] = max(min(new_x, max_x), -max_x)

    async def save_game_state(self) -> None:
        """ゲーム状態をDBに保存"""
        # Gameモデルのインスタンスを取得または作成
        game = await self._get_or_create_game()
        
        # スコアを更新
        game.score_player1 = self.score[self.player1_name]
        game.score_player2 = self.score[self.player2_name]
        
        if not self.is_active:
            game.end_time = timezone.now()
            winner_name = self.get_winner()
            if winner_name:
                # winner_nameからUserモデルのインスタンスを取得
                from django.contrib.auth import get_user_model
                User = get_user_model()
                winner = await User.objects.get(username=winner_name)
                game.winner = winner
        
        await game.save()

    def get_winner(self) -> Optional[str]:
        """勝者のusernameを返す"""
        if self.score[self.player1_name] >= self.WINNING_SCORE:
            return self.player1_name
        if self.score[self.player2_name] >= self.WINNING_SCORE:
            return self.player2_name
        return None

    # 以下、プライベートメソッド
    def _handle_wall_collision(self) -> None:
        if abs(self.ball.x) > self.FIELD_WIDTH / 2:
            self.ball_velocity.x *= -1
            self.ball.x = (self.FIELD_WIDTH / 2) * (1 if self.ball.x > 0 else -1)

    def _handle_paddle_collision(self) -> None:
        paddle_z = self.FIELD_LENGTH / 2
        
        for username, paddle_x in self.paddles.items():
            if self._check_paddle_hit(paddle_x, paddle_z if username == self.player1_name else -paddle_z):
                self.ball_velocity.z *= -1
                self.ball_velocity.x += (self.ball.x - paddle_x) * 0.1

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
            self.INITIAL_BALL_SPEED, 
            0, 
            -self.INITIAL_BALL_SPEED
        )