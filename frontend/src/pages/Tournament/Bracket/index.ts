// frontend/src/pages/Tournament/Bracket/index.ts
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { WebSocketManager, WebSocketMessage } from '@/core/WebSocketManager';
import { TournamentState, TournamentMatch } from '@/types/tournament';

const TournamentBracketPage = new Page({
  name: 'Tournament/Bracket',
  config: {
    layout: CommonLayout,
  },
  mounted: async ({ pg }) => {
    const tournamentId = new URLSearchParams(window.location.search).get('id');
    
    if (!tournamentId) {
      showError('Tournament ID is missing');
      window.location.href = '/tournament';
      return;
    }

    const wsManager = new WebSocketManager();

    wsManager.on('connected', () => {
      wsManager.send({ type: 'join_tournament' });
    });

    wsManager.on('tournament_state', (message: WebSocketMessage) => {
      const state = message.state as TournamentState;
      updateBracket(state);
    });

    wsManager.on('error', (message: string) => {
      showError(message);
    });

    // WebSocket接続を開始
    const username = localStorage.getItem('username') || 'testuser';
    const wsUrl = `ws://${window.location.host}/ws/tournament/${tournamentId}/${username}/`;
    wsManager.connect(wsUrl);

    // クリーンアップ
    return () => {
      wsManager.disconnect();
    };

    function updateBracket(state: TournamentState) {
      // 準決勝の表示
      const semifinalsElement = document.getElementById('semifinals');
      if (semifinalsElement) {
        const semifinalMatches = state.matches.filter(m => m.round === 1);
        semifinalsElement.innerHTML = semifinalMatches.map(match => 
          createMatchElement(match, state.current_round === 1)
        ).join('');
      }

      // 決勝の表示
      const finalsElement = document.getElementById('finals');
      if (finalsElement) {
        const finalMatch = state.matches.find(m => m.round === 2);
        if (finalMatch) {
          finalsElement.innerHTML = createMatchElement(finalMatch, state.current_round === 2);
        }
      }
    }

    function createMatchElement(match: TournamentMatch, isCurrent: boolean): string {
      return `
        <div class="match ${isCurrent ? 'current' : ''}">
          ${createPlayerElement(match.player1, match.scores.player1, match.winner === match.player1)}
          ${createPlayerElement(match.player2, match.scores.player2, match.winner === match.player2)}
        </div>
      `;
    }

    function createPlayerElement(playerName: string | null, score: number, isWinner: boolean): string {
      if (!playerName) {
        return `<div class="match-player empty">
          <span class="player-name">TBD</span>
          <span class="player-score">-</span>
        </div>`;
      }

      return `<div class="match-player ${isWinner ? 'winner' : ''}">
        <span class="player-name">${playerName}</span>
        <span class="player-score">${score}</span>
      </div>`;
    }

    function showError(message: string) {
      const errorContainer = document.getElementById('error-container');
      if (errorContainer) {
        errorContainer.innerHTML = `
          <div class="error-message">${message}</div>
        `;
      }
    }
  },
});

export default TournamentBracketPage;