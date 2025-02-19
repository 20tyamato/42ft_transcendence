// frontend/src/pages/Tournament/index.ts
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { WebSocketManager, WebSocketMessage } from '@/core/WebSocketManager';

interface TournamentState {
  status: 'WAITING_PLAYERS' | 'IN_PROGRESS' | 'COMPLETED';
  current_round: number;
  participants: string[];
  matches: {
    id: number;
    round: number;
    match_number: number;
    player1: string | null;
    player2: string | null;
    winner: string | null;
    scores: {
      player1: number;
      player2: number;
    };
  }[];
}

const TournamentPage = new Page({
  name: 'Tournament',
  config: {
    layout: CommonLayout,
  },
  mounted: async ({ pg }) => {
    const wsManager = new WebSocketManager();
    let tournamentState: TournamentState | null = null;

    // WebSocket接続の設定
    wsManager.on('connected', () => {
      wsManager.send({ type: 'join_tournament' });
    });

    wsManager.on('tournament_state', (message: WebSocketMessage) => {
      tournamentState = message.state as TournamentState;
      updateView();
    });

    wsManager.on('error', (message: string) => {
      showError(message);
    });

    // WebSocket接続を開始
    const wsUrl = `ws://${window.location.host}/ws/tournament/1/testuser/`; // TODO: IDとユーザー名を動的に
    wsManager.connect(wsUrl);

    // ビュー更新関数
    function updateView() {
      const mainElement = document.querySelector('main');
      if (!mainElement || !tournamentState) return;

      switch (tournamentState.status) {
        case 'WAITING_PLAYERS':
          mainElement.innerHTML = `
            <div class="waiting-room">
              <h2>Waiting Room</h2>
              <p>Players (${tournamentState.participants.length}/4):</p>
              <ul>
                ${tournamentState.participants.map(player => `
                  <li>${player}</li>
                `).join('')}
              </ul>
            </div>
          `;
          break;

        case 'IN_PROGRESS':
          mainElement.innerHTML = `
            <div class="tournament">
              <h2>Tournament (Round ${tournamentState.current_round})</h2>
              <div class="matches">
                ${tournamentState.matches.map(match => `
                  <div class="match">
                    <div class="player">${match.player1 || 'TBD'}</div>
                    <div class="vs">vs</div>
                    <div class="player">${match.player2 || 'TBD'}</div>
                    ${match.winner ? `<div class="winner">Winner: ${match.winner}</div>` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          `;
          break;

        case 'COMPLETED':
          const finalMatch = tournamentState.matches.find(m => m.round === 2);
          if (finalMatch) {
            mainElement.innerHTML = `
              <div class="results">
                <h2>Tournament Complete</h2>
                <div class="winner-display">
                  <h3>Winner</h3>
                  <p>${finalMatch.winner}</p>
                </div>
              </div>
            `;
          }
          break;
      }
    }

    // エラー表示関数
    function showError(message: string) {
      const mainElement = document.querySelector('main');
      if (!mainElement) return;

      const errorElement = document.createElement('div');
      errorElement.className = 'error-message';
      errorElement.textContent = message;

      mainElement.prepend(errorElement);
      setTimeout(() => errorElement.remove(), 5000);
    }
  },
});

export default TournamentPage;