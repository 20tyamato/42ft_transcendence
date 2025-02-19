// frontend/src/pages/Tournament/Waiting/index.ts
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { WebSocketManager, WebSocketMessage } from '@/core/WebSocketManager';

interface TournamentState {
  status: 'WAITING_PLAYERS' | 'IN_PROGRESS' | 'COMPLETED';
  participants: string[];
  current_round: number;
  matches: any[];
}

const TournamentWaitingPage = new Page({
  name: 'Tournament/Waiting',
  config: {
    layout: CommonLayout,
  },
  mounted: async ({ pg }) => {
    const wsManager = new WebSocketManager();
    const tournamentId = new URLSearchParams(window.location.search).get('id');
    
    if (!tournamentId) {
      showError('Tournament ID is missing');
      window.location.href = '/tournament';
      return;
    }

    // Leave tournament button handler
    const leaveButton = document.getElementById('leave-tournament');
    if (leaveButton instanceof HTMLElement) {
      leaveButton.addEventListener('click', () => {
        wsManager.disconnect();
        window.location.href = '/tournament';
      });
    }

    // WebSocket event handlers
    wsManager.on('connected', () => {
      wsManager.send({ type: 'join_tournament' });
    });

    wsManager.on('tournament_state', (message: WebSocketMessage) => {
      const state = message.state as TournamentState;
      updateWaitingRoom(state);

      // トーナメントが開始されたら試合ページへ遷移
      if (state.status === 'IN_PROGRESS') {
        window.location.href = `/tournament/game?id=${tournamentId}`;
      }
    });

    wsManager.on('error', (message: string) => {
      showError(message);
    });

    // Connect to WebSocket
    // TODO: 実際のユーザー名を使用
    const username = 'testuser';
    const wsUrl = `ws://${window.location.host}/ws/tournament/${tournamentId}/${username}/`;
    wsManager.connect(wsUrl);

    // Cleanup
    return () => {
      wsManager.disconnect();
    };

    function updateWaitingRoom(state: TournamentState) {
      // Update participant count
      const countElement = document.getElementById('participant-count');
      if (countElement) {
        countElement.textContent = state.participants.length.toString();
      }

      // Update participant list
      const listElement = document.getElementById('participant-list');
      if (listElement) {
        listElement.innerHTML = Array(4).fill(null).map((_, index) => {
          const participant = state.participants[index];
          return `
            <div class="participant-slot ${participant ? '' : 'empty'}">
              ${participant ? `
                <div class="player-name">${participant}</div>
                <div class="player-status">Ready</div>
              ` : 'Waiting for player...'}
            </div>
          `;
        }).join('');
      }
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

export default TournamentWaitingPage;