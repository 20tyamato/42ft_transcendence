from typing import Dict, Optional, List
import asyncio
from django.utils import timezone
from .repositories import TournamentRepository

class TournamentService:
    """トーナメントの進行を管理するサービスクラス"""
    
    def __init__(self):
        self.active_tournaments: Dict[int, dict] = {}  # tournament_id -> tournament_state
        self.game_tasks: Dict[int, asyncio.Task] = {}  # tournament_id -> update_task

    async def initialize_tournament(self, tournament_id: int) -> bool:
        """トーナメントの初期化"""
        tournament = await TournamentRepository.get_tournament(tournament_id)
        if not tournament:
            return False

        self.active_tournaments[tournament_id] = {
            "status": "WAITING_PLAYERS",
            "participants": [],
            "current_round": 0,
            "matches": [],
        }
        return True

    async def add_participant(self, tournament_id: int, username: str) -> bool:
        tournament_state = self.active_tournaments.get(tournament_id)
        if not tournament_state:
            return False

        # 参加者の追加（データベース）
        participant = await TournamentRepository.add_participant(tournament_id, username)
        if not participant:
            return False

        # メモリ上の状態更新
        tournament_state["participants"].append(username)
        
        # 4人集まったら即開始
        if len(tournament_state["participants"]) == 4:
            await self.start_tournament(tournament_id)

        return True

    async def start_tournament(self, tournament_id: int) -> None:
        """トーナメントの開始"""
        tournament_state = self.active_tournaments.get(tournament_id)
        if not tournament_state or tournament_state["status"] != "WAITING_PLAYERS":
            return

        # ステータス更新
        tournament_state["status"] = "IN_PROGRESS"
        tournament_state["current_round"] = 1
        await TournamentRepository.update_tournament_status(
            tournament_id, 
            "IN_PROGRESS", 
            current_round=1
        )

        # ブラケットの生成
        matches = await TournamentRepository.create_tournament_brackets(
            tournament_id,
            tournament_state["participants"]
        )
        tournament_state["matches"] = matches

        # 試合状態の監視タスクを開始
        self.game_tasks[tournament_id] = asyncio.create_task(
            self.monitor_tournament_progress(tournament_id)
        )

    async def handle_match_result(self, tournament_id: int, match_id: int, winner_username: str, scores: dict) -> None:
        """試合結果の処理
        
        Args:
            tournament_id (int): トーナメントID
            match_id (int): 試合ID
            winner_username (str): 勝者のユーザー名
            scores (dict): 試合のスコア {"player1": int, "player2": int}
        """
        tournament_state = self.active_tournaments.get(tournament_id)
        if not tournament_state or tournament_state["status"] != "IN_PROGRESS":
            return

        # 試合結果の記録
        game = await TournamentRepository.record_match_result(
            match_id,
            winner_username,
            scores["player1"],
            scores["player2"]
        )
        if not game:
            return

        # 現在のマッチ情報を取得して状態を更新
        match = next((m for m in tournament_state["matches"] if m.id == match_id), None)
        if not match:
            return
            
        # 準決勝の場合、勝者を決勝戦に進出させる
        if match.round_number == 1:  # 準決勝
            next_match = await TournamentRepository.advance_winner(match_id, winner_username)
            if next_match:
                # 決勝戦の準備が整ったかチェック
                if next_match.player1 and next_match.player2:
                    tournament_state["current_round"] = 2
                    await TournamentRepository.update_tournament_status(
                        tournament_id, 
                        "IN_PROGRESS",
                        current_round=2
                    )
        else:  # 決勝戦
            await self.complete_tournament(tournament_id)

    async def handle_participant_disconnection(self, tournament_id: int, username: str) -> None:
        tournament_state = self.active_tournaments.get(tournament_id)
        if not tournament_state:
            return

        if tournament_state["status"] == "WAITING_PLAYERS":
            # 待機中の切断は参加キャンセルとして扱う
            tournament_state["participants"].remove(username)
        else:
            # 試合中の切断は敗北として処理
            current_match = await TournamentRepository.get_current_match(tournament_id, username)
            if current_match:
                opponent_username = (
                    current_match.player2.username 
                    if username == current_match.player1.username 
                    else current_match.player1.username
                )
                await self.handle_match_result(
                    tournament_id,
                    current_match.id,
                    opponent_username,
                    {
                        "player1": 0 if username == current_match.player1.username else 15,
                        "player2": 15 if username == current_match.player1.username else 0
                    }
                )

    async def monitor_tournament_progress(self, tournament_id: int) -> None:
        """トーナメントの進行状態を監視"""
        try:
            while True:
                tournament_state = self.active_tournaments.get(tournament_id)
                if not tournament_state or tournament_state["status"] != "IN_PROGRESS":
                    break

                # 完了チェック
                if await TournamentRepository.check_tournament_completion(tournament_id):
                    await self.complete_tournament(tournament_id)
                    break

                await asyncio.sleep(1)  # ポーリング間隔

        except asyncio.CancelledError:
            pass
        except Exception as e:
            print(f"Error in tournament monitoring: {e}")

    async def complete_tournament(self, tournament_id: int) -> None:
        """トーナメントの完了処理"""
        tournament_state = self.active_tournaments.get(tournament_id)
        if not tournament_state:
            return

        # ステータス更新
        tournament_state["status"] = "COMPLETED"
        await TournamentRepository.update_tournament_status(tournament_id, "COMPLETED")

        # 監視タスクのクリーンアップ
        if tournament_id in self.game_tasks:
            self.game_tasks[tournament_id].cancel()
            del self.game_tasks[tournament_id]

        # メモリ上の状態をクリア
        del self.active_tournaments[tournament_id]

    async def get_tournament_state(self, tournament_id: int) -> dict:
        """トーナメントの現在の状態を取得
        
        Args:
            tournament_id (int): トーナメントID
            
        Returns:
            dict: トーナメントの状態
            {
                "status": str,  # WAITING_PLAYERS, IN_PROGRESS, COMPLETED
                "current_round": int,  # 0: 待機中, 1: 準決勝, 2: 決勝
                "participants": List[str],  # 参加者のユーザーネームリスト
                "matches": [
                    {
                        "id": int,
                        "round": int,
                        "match_number": int,  # 1,2: 準決勝, 3: 決勝
                        "player1": str | None,
                        "player2": str | None,
                        "winner": str | None,
                        "scores": dict  # {"player1": int, "player2": int}
                    },
                    ...
                ]
            }
        """
        tournament_state = self.active_tournaments.get(tournament_id)
        if not tournament_state:
            # DBから情報を取得
            tournament = await TournamentRepository.get_tournament(tournament_id)
            if not tournament:
                return None
            
            # 過去のトーナメント情報を構築
            matches = await TournamentRepository.get_tournament_matches(tournament_id)
            participants = await TournamentRepository.get_participants(tournament_id)
            
            return {
                "status": tournament.status,
                "current_round": tournament.current_round,
                "participants": [p.user.username for p in participants],
                "matches": [
                    {
                        "id": match.id,
                        "round": match.round_number,
                        "match_number": match.match_number,
                        "player1": match.player1.username if match.player1 else None,
                        "player2": match.player2.username if match.player2 else None,
                        "winner": match.game.winner.username if match.game and match.game.winner else None,
                        "scores": {
                            "player1": match.game.score_player1 if match.game else 0,
                            "player2": match.game.score_player2 if match.game else 0
                        }
                    }
                    for match in matches
                ]
            }
        
        # アクティブなトーナメントの状態を返す
        return {
            "status": tournament_state["status"],
            "current_round": tournament_state["current_round"],
            "participants": tournament_state["participants"],
            "matches": [
                {
                    "id": match.id,
                    "round": match.round_number,
                    "match_number": match.match_number,
                    "player1": match.player1.username if match.player1 else None,
                    "player2": match.player2.username if match.player2 else None,
                    "winner": match.game.winner.username if match.game and match.game.winner else None,
                    "scores": {
                        "player1": match.game.score_player1 if match.game else 0,
                        "player2": match.game.score_player2 if match.game else 0
                    }
                }
                for match in tournament_state["matches"]
            ]
        }
