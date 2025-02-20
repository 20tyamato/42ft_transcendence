import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { WS_URL, API_URL } from '@/config/config';
import { TournamentState } from '@/types/tournament';

const TournamentWaitingPage = new Page({
  name: 'Tournament/Waiting',
  config: {
    layout: CommonLayout,
  },
  mounted: async ({ pg }) => {
    const tournamentId = new URLSearchParams(window.location.search).get('id');
    let socket: WebSocket | null = null;

    if (!tournamentId) {
      showError('Tournament ID is missing');
      window.location.href = '/tournament';
      return;
    }

    // Join tournament button handler
    const joinButton = document.getElementById('join-tournament');
    if (joinButton instanceof HTMLElement) {
      joinButton.addEventListener('click', async () => {
        try {
          const response = await fetch(`${API_URL}/api/tournaments/${tournamentId}/join/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Token ${localStorage.getItem('token')}`,
            },
          });

          console.log('Response status:', response.status);
          console.log('response data:', response);

          if (!response.ok) {
            throw new Error('Failed to join tournament');
          }

          // WebSocket接続を更新
          if (socket) {
            socket.send(JSON.stringify({ type: 'join_tournament' }));
          }
        } catch (error) {
          showError('Failed to join tournament');
        }
      });
    }

    // Leave tournament button handler
    const leaveButton = document.getElementById('leave-tournament');
    if (leaveButton instanceof HTMLElement) {
      leaveButton.addEventListener('click', () => {
        handleNavigation();
        window.location.href = '/tournament';
      });
    }

    // WebSocketの切断と遷移を行う関数
    const handleNavigation = () => {
      if (socket) {
        socket.close();
        socket = null;
      }
    };

    function initWebSocket() {
      const username = localStorage.getItem('username');
      if (!username) {
        showError('User is not logged in');
        window.location.href = '/login';
        return;
      }

      // WebSocket URLの構築
      const wsUrl = `${WS_URL}/ws/tournament/${tournamentId}/${username}/`;
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('WebSocket connected');
        socket?.send(JSON.stringify({ type: 'join_tournament' }));
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received tournament state:', data);

          if (data.type === 'tournament_state') {
            const state = data.state;
            updateWaitingRoom(state);

            if (state.status === 'IN_PROGRESS') {
              window.location.href = `/tournament/game?id=${tournamentId}`;
            }
          }
        } catch (error) {
          console.error('Error handling message:', error);
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        showError('Connection error occurred');
      };

      socket.onclose = () => {
        console.log('WebSocket disconnected');
        // 5秒後に再接続を試みる
        setTimeout(initWebSocket, 5000);
      };
    }

    // ブラウザの戻る/進むボタン対応
    window.addEventListener('popstate', handleNavigation);

    // WebSocket接続開始
    initWebSocket();

    // クリーンアップ
    return () => {
      handleNavigation();
      window.removeEventListener('popstate', handleNavigation);
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
        listElement.innerHTML = Array(4)
          .fill(null)
          .map((_, index) => {
            const participant = state.participants[index];
            return `
            <div class="participant-slot ${participant ? '' : 'empty'}">
              ${
                participant
                  ? `
                <div class="player-name">${participant}</div>
                <div class="player-status">Ready</div>
              `
                  : 'Waiting for player...'
              }
            </div>
          `;
          })
          .join('');
      }

      // Update button visibility
      const username = localStorage.getItem('username');
      const isParticipant = state.participants.includes(username);
      const joinButton = document.getElementById('join-tournament');
      const leaveButton = document.getElementById('leave-tournament');

      if (joinButton && leaveButton) {
        joinButton.style.display = isParticipant ? 'none' : 'inline-block';
        leaveButton.style.display = isParticipant ? 'inline-block' : 'none';
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
