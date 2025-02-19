// frontend/src/pages/Tournament/Result/index.ts
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';

interface TournamentMatch {
  id: number;
  round: number;
  match_number: number;
  player1: string;
  player2: string;
  winner: string;
  scores: {
    player1: number;
    player2: number;
  };
}

interface TournamentResult {
  tournament_id: number;
  winner: string;
  matches: TournamentMatch[];
  completed_at: string;
}

const TournamentResultPage = new Page({
  name: 'Tournament/Result',
  config: {
    layout: CommonLayout,
  },
  mounted: async ({ pg }) => {
    const tournamentId = new URLSearchParams(window.location.search).get('id');
    
    if (!tournamentId) {
      window.location.href = '/tournament';
      return;
    }

    try {
      // トーナメント結果を取得
      const response = await fetch(`/api/tournaments/${tournamentId}/result`);
      if (!response.ok) throw new Error('Failed to fetch tournament result');
      const result: TournamentResult = await response.json();

      // 優勝者表示を更新
      const winnerDisplay = document.getElementById('winner-display');
      if (winnerDisplay) {
        winnerDisplay.innerHTML = `
          <div class="winner-title">Tournament Champion</div>
          <div class="winner-name">${result.winner}</div>
          <div class="completed-at">Completed at: ${formatDate(result.completed_at)}</div>
        `;
      }

      // トーナメントサマリーを更新
      const summaryDisplay = document.getElementById('tournament-summary');
      if (summaryDisplay) {
        const matches = [...result.matches].sort((a, b) => {
          // ラウンドとマッチ番号でソート
          if (a.round !== b.round) return a.round - b.round;
          return a.match_number - b.match_number;
        });

        summaryDisplay.innerHTML = matches.map(match => `
          <div class="match-result">
            <h3>${match.round === 1 ? 'Semifinal' : 'Final'} #${match.match_number}</h3>
            <div class="match-score">
              <div class="player-info">
                <span class="player-name">${match.player1}</span>
                <span class="player-score">${match.scores.player1}</span>
                ${match.winner === match.player1 ? '<span class="winner-mark">Winner</span>' : ''}
              </div>
              <div class="player-info">
                <span class="player-name">${match.player2}</span>
                <span class="player-score">${match.scores.player2}</span>
                ${match.winner === match.player2 ? '<span class="winner-mark">Winner</span>' : ''}
              </div>
            </div>
          </div>
        `).join('');
      }

      // 戻るボタンのイベントリスナー
      const returnButton = document.getElementById('return-button');
      if (returnButton instanceof HTMLElement) {
        returnButton.addEventListener('click', () => {
          window.location.href = '/modes';
        });
      }

    } catch (error) {
      console.error('Error fetching tournament result:', error);
      window.location.href = '/modes';
    }

    function formatDate(dateString: string): string {
      return new Date(dateString).toLocaleString();
    }
  },
});

export default TournamentResultPage;