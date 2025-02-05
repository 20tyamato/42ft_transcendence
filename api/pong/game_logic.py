from typing import Optional, Dict, Tuple
from dataclasses import dataclass
from django.utils import timezone
from .models import Game

@dataclass
class Vector3D:
    x: float
    y: float
    z: float


@dataclass
class PlayerView:
    position: Vector3D  # 実際の3D空間での位置
    view_direction: int  # 1 or -1 (1: +Z方向から見る, -1: -Z方向から見る)

class MultiplayerPongGame:
    def __init__(self, game_id: int, player1_id: int, player2_id: int):
        self.game_id = game_id
        self.player1_id = player1_id
        self.player2_id = player2_id
        
        # プレイヤーの視点情報を設定
        self.player_views = {
            player1_id: PlayerView(
                position=Vector3D(0, 0, self.FIELD_LENGTH/2),
                view_direction=1
            ),
            player2_id: PlayerView(
                position=Vector3D(0, 0, -self.FIELD_LENGTH/2),
                view_direction=-1
            )
        }

    def get_state_for_player(self, player_id: int) -> Dict:
        """
        プレイヤーごとの視点に合わせたゲーム状態を返す
        """
        base_state = self.get_state()
        view = self.player_views[player_id]
        
        # プレイヤーの視点に合わせて座標を変換
        if view.view_direction == -1:
            # 座標を反転
            base_state['ball']['position']['z'] *= -1
            base_state['ball']['velocity']['z'] *= -1
            # プレイヤーの位置情報も視点に合わせて入れ替え
            base_state['players'] = {
                str(self.player2_id): {'x': self.paddles[self.player2_id], 'z': -self.FIELD_LENGTH/2},
                str(self.player1_id): {'x': self.paddles[self.player1_id], 'z': self.FIELD_LENGTH/2}
            }
        else:
            base_state['players'] = {
                str(self.player1_id): {'x': self.paddles[self.player1_id], 'z': self.FIELD_LENGTH/2},
                str(self.player2_id): {'x': self.paddles[self.player2_id], 'z': -self.FIELD_LENGTH/2}
            }

        return base_state