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
            "countdown_task": None
        }
        return True

    async def add_participant(self, tournament_id: int, username: str) -> bool:
        """参加者の追加"""
        tournament_state = self.active_tournaments.get(tournament_id)
        if not tournament_state:
            return False

        # 参加者の追加（データベース）
        participant = await TournamentRepository.add_participant(tournament_id, username)
        if not participant:
            return False

        # メモリ上の状態更新
        tournament_state["participants"].append(username)
        
        # 参加者数チェックとトーナメント開始判断
        if len(tournament_state["participants"]) >= 8:
            await self.start_tournament(tournament_id)
        elif len(tournament_state["participants"]) >= 2:
            await self.start_countdown(tournament_id)

        return True

    async def start_tournament(self, tournament_id: int) -> None:
        """トーナメントの開始"""
        tournament_state = self.active_tournaments.get(tournament_id)
        if not tournament_state or tournament_state["status"] != "WAITING_PLAYERS":
            return

        # カウントダウンタスクのキャンセル（存在する場合）
        if tournament_state["countdown_task"]:
            tournament_state["countdown_task"].cancel()
            tournament_state["countdown_task"] = None

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
        """試合結果の処理"""
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

        # Userモデルへの直接アクセスを避け、Repositoryを通じて勝者を次の試合に進める
        next_match = await TournamentRepository.advance_winner(match_id, winner_username)

        # トーナメント完了チェック
        if await TournamentRepository.check_tournament_completion(tournament_id):
            await self.complete_tournament(tournament_id)

    async def handle_participant_disconnection(self, tournament_id: int, username: str) -> None:
        """参加者の切断処理"""
        tournament_state = self.active_tournaments.get(tournament_id)
        if not tournament_state:
            return

        if tournament_state["status"] == "WAITING_PLAYERS":
            if tournament_state["countdown_task"]:
                # カウントダウン中の切断は参加キャンセルとして扱う
                tournament_state["participants"].remove(username)
                if len(tournament_state["participants"]) < 2:
                    tournament_state["countdown_task"].cancel()
                    tournament_state["countdown_task"] = None
        else:
            # 試合中の切断は敗北として処理
            current_match = await TournamentRepository.get_current_match(tournament_id, username)
            if current_match:
                # 対戦相手を勝者として記録
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

    async def start_countdown(self, tournament_id: int) -> None:
        """開始カウントダウンの開始"""
        tournament_state = self.active_tournaments.get(tournament_id)
        if not tournament_state or tournament_state["status"] != "WAITING_PLAYERS":
            return

        if tournament_state["countdown_task"]:
            tournament_state["countdown_task"].cancel()

        tournament_state["countdown_task"] = asyncio.create_task(
            self._countdown(tournament_id)
        )

    async def _countdown(self, tournament_id: int) -> None:
        """60秒カウントダウンの実行"""
        try:
            for _ in range(60):
                tournament_state = self.active_tournaments.get(tournament_id)
                if not tournament_state or len(tournament_state["participants"]) < 2:
                    return
                await asyncio.sleep(1)

            await self.start_tournament(tournament_id)
            
        except asyncio.CancelledError:
            pass