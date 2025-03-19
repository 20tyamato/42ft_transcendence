import unittest
from pong.game_logic import MultiplayerPongGame, Vector3D


class TestMultiplayerPongGame(unittest.TestCase):
    """MultiplayerPongGameクラスのテスト"""

    def setUp(self):
        """テスト前の準備"""
        self.session_id = "test_session"
        self.player1 = "player1"
        self.player2 = "player2"
        self.game = MultiplayerPongGame(
            session_id=self.session_id,
            player1_name=self.player1,
            player2_name=self.player2
        )
        # テスト用に勝利スコアを小さくする
        self.original_winning_score = MultiplayerPongGame.WINNING_SCORE
        MultiplayerPongGame.WINNING_SCORE = 2

    def tearDown(self):
        """テスト後のクリーンアップ"""
        # WINNINGSCOREを元に戻す
        MultiplayerPongGame.WINNING_SCORE = self.original_winning_score

    def test_initialization(self):
        """ゲームが正しく初期化されるかテスト"""
        self.assertEqual(self.game.session_id, self.session_id)
        self.assertEqual(self.game.player1_name, self.player1)
        self.assertEqual(self.game.player2_name, self.player2)
        self.assertEqual(self.game.score[self.player1], 0)
        self.assertEqual(self.game.score[self.player2], 0)
        self.assertTrue(self.game.is_active)
        self.assertIsNone(self.game.db_game_id)
        # ボールが中央にあることを確認
        self.assertEqual(self.game.ball.x, 0)
        self.assertEqual(self.game.ball.y, 30)
        self.assertEqual(self.game.ball.z, 0)

    def test_update_moves_ball(self):
        """updateメソッドがボールを正しく移動させるかテスト"""
        # 初期位置を記録
        initial_x = self.game.ball.x
        initial_z = self.game.ball.z
        
        # 1秒間のアップデート
        self.game.update(1.0)
        
        # ボールが移動していることを確認
        self.assertNotEqual(self.game.ball.x, initial_x)
        self.assertNotEqual(self.game.ball.z, initial_z)
        
        # 速度ベクトルに従って移動していることを確認
        expected_x = initial_x + self.game.ball_velocity.x * 1.0
        expected_z = initial_z + self.game.ball_velocity.z * 1.0
        self.assertEqual(self.game.ball.x, expected_x)
        self.assertEqual(self.game.ball.z, expected_z)

    def test_wall_collision(self):
        """壁との衝突が正しく処理されるかテスト"""
        # ボールを壁の近くに移動
        self.game.ball.x = self.game.FIELD_WIDTH / 2 - 1
        
        # 元の速度を記録
        original_velocity_x = self.game.ball_velocity.x
        
        # 壁に向かって移動するように速度を設定
        self.game.ball_velocity.x = 100
        
        # 衝突するまでアップデート
        self.game.update(0.1)
        
        # x方向の速度が反転していることを確認
        self.assertAlmostEqual(self.game.ball_velocity.x, -100, delta=1)
        
        # 反対側の壁も確認
        self.game.ball.x = -self.game.FIELD_WIDTH / 2 + 1
        self.game.ball_velocity.x = -100
        self.game.update(0.1)
        self.assertAlmostEqual(self.game.ball_velocity.x, 100, delta=1)

    def test_paddle_collision(self):
        """パドルとの衝突が正しく処理されるかテスト"""
        # プレイヤー1のパドルの位置とボールの位置を設定
        self.game.paddles[self.player1] = 0  # パドルを中央に
        self.game.ball.x = 0  # ボールも中央に
        self.game.ball.z = self.game.FIELD_LENGTH / 2 - self.game.BALL_RADIUS - 1  # パドルにほぼ接触する位置
        
        # パドルに向かって移動するように速度を設定
        self.game.ball_velocity.z = self.game.INITIAL_BALL_SPEED  # パドルに向かう速度
        original_velocity_z = self.game.ball_velocity.z  # 元の速度を保存
        
        # 衝突するまでアップデート
        self.game.update(0.1)
        
        # z方向の速度が反転していることを確認
        self.assertNotEqual(self.game.ball_velocity.z, original_velocity_z, "ボールの速度が変化すべき")

    def test_scoring(self):
        """ボールが端を超えるとスコアが加算されるかテスト"""
        # プレイヤー1がスコアする状況を作る（ボールをプレイヤー2側の端に配置）
        self.game.ball.z = -self.game.FIELD_LENGTH / 2 - 1
        
        # アップデートしてスコア処理を発生させる
        self.game.update(0.01)
        
        # プレイヤー1のスコアが増えていることを確認
        self.assertEqual(self.game.score[self.player1], 1)
        self.assertEqual(self.game.score[self.player2], 0)
        
        # ボールがリセットされていることを確認
        self.assertEqual(self.game.ball.x, 0)
        self.assertEqual(self.game.ball.y, 30)
        self.assertEqual(self.game.ball.z, 0)
        
        # 今度はプレイヤー2がスコアする状況
        self.game.ball.z = self.game.FIELD_LENGTH / 2 + 1
        self.game.update(0.01)
        
        # プレイヤー2のスコアが増えていることを確認
        self.assertEqual(self.game.score[self.player1], 1)
        self.assertEqual(self.game.score[self.player2], 1)

    def test_game_end(self):
        """スコアが上限に達するとゲームが終了するかテスト"""
        # プレイヤー1が勝利条件を満たすまでスコア
        self.game.score[self.player1] = MultiplayerPongGame.WINNING_SCORE - 1
        
        # スコアを追加
        self.game.ball.z = -self.game.FIELD_LENGTH / 2 - 1
        self.game.update(0.01)
        
        # ゲームが終了していることを確認
        self.assertFalse(self.game.is_active)
        
        # 勝者がプレイヤー1であることを確認
        self.assertEqual(self.game.get_winner(), self.player1)

    def test_disconnection(self):
        """プレイヤー切断時の処理が正しく行われるかテスト"""
        # プレイヤー1が切断
        self.game.handle_disconnection(self.player1)
        
        # ゲームが終了し、プレイヤー2が勝者になっていることを確認
        self.assertFalse(self.game.is_active)
        self.assertEqual(self.game.score[self.player2], MultiplayerPongGame.WINNING_SCORE)
        self.assertEqual(self.game.score[self.player1], 0)
        self.assertEqual(self.game.get_winner(), self.player2)

    def test_move_player(self):
        """プレイヤーの移動が正しく処理されるかテスト"""
        # プレイヤー1を右に移動
        new_x = 100
        self.game.move_player(self.player1, new_x)
        
        # 位置が更新されていることを確認
        self.assertEqual(self.game.paddles[self.player1], new_x)
        
        # 移動制限が機能するかテスト（フィールド幅を超える値）
        max_x = (self.game.FIELD_WIDTH - self.game.PADDLE_WIDTH) / 2
        self.game.move_player(self.player1, max_x + 100)
        
        # 最大値に制限されていることを確認
        self.assertEqual(self.game.paddles[self.player1], max_x)
        
        # 最小値のテスト
        self.game.move_player(self.player1, -max_x - 100)
        self.assertEqual(self.game.paddles[self.player1], -max_x)
        
        # 存在しないプレイヤーの移動は無視されることを確認
        original_positions = self.game.paddles.copy()
        self.game.move_player("non_existent_player", 50)
        self.assertEqual(self.game.paddles, original_positions)


if __name__ == '__main__':
    unittest.main()