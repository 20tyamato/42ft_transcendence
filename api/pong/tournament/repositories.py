from typing import Optional, List
from django.db import transaction
from django.utils import timezone
from ..models import (
    TournamentGameSession,
    TournamentParticipant,
    TournamentMatch,
    Game,
    User
)

class TournamentRepository:
    """トーナメントに関連するデータベース操作を抽象化するリポジトリクラス"""

    @classmethod
    async def get_tournament(cls, tournament_id: int) -> Optional[TournamentGameSession]:
        """トーナメントセッションの取得"""
        try:
            return await TournamentGameSession.objects.aget(id=tournament_id)
        except TournamentGameSession.DoesNotExist:
            return None

    @classmethod
    async def get_participants(cls, tournament_id: int) -> List[TournamentParticipant]:
        """トーナメント参加者リストの取得"""
        return [
            participant async for participant 
            in TournamentParticipant.objects.filter(tournament_id=tournament_id)
        ]

    @classmethod
    async def add_participant(cls, tournament_id: int, username: str) -> Optional[TournamentParticipant]:
        """参加者の追加"""
        try:
            tournament = await TournamentGameSession.objects.aget(id=tournament_id)
            user = await User.objects.aget(username=username)
            
            # 重複参加のチェック
            exists = await TournamentParticipant.objects.filter(
                tournament=tournament,
                user=user
            ).aexists()
            
            if exists:
                return None

            return await TournamentParticipant.objects.acreate(
                tournament=tournament,
                user=user
            )
        except (TournamentGameSession.DoesNotExist, User.DoesNotExist):
            return None

    @classmethod
    async def get_current_match(cls, tournament_id: int, username: str) -> Optional[TournamentMatch]:
        """ユーザーの現在進行中のマッチを取得"""
        try:
            user = await User.objects.aget(username=username)
            return await TournamentMatch.objects.filter(
                tournament_id=tournament_id,
                game__isnull=True
            ).filter(
                models.Q(player1=user) | models.Q(player2=user)
            ).aget()
        except (TournamentMatch.DoesNotExist, User.DoesNotExist):
            return None

    @classmethod
    @transaction.atomic
    async def create_tournament_brackets(cls, tournament_id: int, participants: List[User]) -> List[TournamentMatch]:
        """トーナメントブラケットの生成"""
        tournament = await TournamentGameSession.objects.aget(id=tournament_id)
        matches = []
        
        # 参加者数に基づいてブラケットを生成
        num_players = len(participants)
        num_first_round = num_players - 1
        
        # まず決勝戦を作成
        final_match = await TournamentMatch.objects.acreate(
            tournament=tournament,
            round_number=1,
            match_number=num_first_round
        )
        matches.append(final_match)
        
        # 残りのマッチを生成
        for i in range(num_first_round - 1):
            match = await TournamentMatch.objects.acreate(
                tournament=tournament,
                round_number=1,
                match_number=i + 1,
                next_match=final_match
            )
            matches.append(match)
        
        return matches

    @classmethod
    @transaction.atomic
    async def record_match_result(
        cls, 
        match_id: int, 
        winner_username: str, 
        score_player1: int, 
        score_player2: int
    ) -> Optional[Game]:
        """試合結果の記録"""
        try:
            match = await TournamentMatch.objects.aget(id=match_id)
            winner = await User.objects.aget(username=winner_username)
            
            game = await Game.objects.acreate(
                player1=match.player1,
                player2=match.player2,
                winner=winner,
                score_player1=score_player1,
                score_player2=score_player2,
                end_time=timezone.now()
            )
            
            match.game = game
            await match.asave()
            
            return game
        except (TournamentMatch.DoesNotExist, User.DoesNotExist):
            return None

    @classmethod
    @transaction.atomic
    async def advance_winner(cls, match_id: int, winner_username: str) -> Optional[TournamentMatch]:
        """勝者を次の試合に進める"""
        try:
            match = await TournamentMatch.objects.aget(id=match_id)
            if not match.next_match:
                return None
                
            next_match = match.next_match
            winner = await User.objects.aget(username=winner_username)
            
            # 次の試合の空いているスロットに勝者を配置
            if next_match.player1 is None:
                next_match.player1 = winner
            else:
                next_match.player2 = winner
                
            await next_match.asave()
            return next_match
            
        except (TournamentMatch.DoesNotExist, User.DoesNotExist):
            return None

    @classmethod
    async def update_tournament_status(
        cls, 
        tournament_id: int, 
        status: str, 
        current_round: int = None
    ) -> Optional[TournamentGameSession]:
        """トーナメントの状態を更新"""
        try:
            tournament = await TournamentGameSession.objects.aget(id=tournament_id)
            tournament.status = status
            if current_round is not None:
                tournament.current_round = current_round
                
            await tournament.asave()
            return tournament
        except TournamentGameSession.DoesNotExist:
            return None

    @classmethod
    async def check_tournament_completion(cls, tournament_id: int) -> bool:
        """トーナメントが完了しているかチェック"""
        # 未完了のマッチが存在するかチェック
        incomplete_matches = await TournamentMatch.objects.filter(
            tournament_id=tournament_id,
            game__isnull=True
        ).aexists()
        
        return not incomplete_matches