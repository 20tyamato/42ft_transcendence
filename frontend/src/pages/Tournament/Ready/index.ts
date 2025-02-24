// frontend/src/pages/Tournament/Ready/index.ts
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { tournamentRepository } from '@/models/Tournament/repository';
import './style.css';

const ReadyPage = new Page({
  name: 'Tournament/Ready',
  config: {
    layout: CommonLayout,
    html: '/src/pages/Tournament/Ready/index.html',
  },
  mounted: async () => {
    let isReady = false;
    const timerElement = document.getElementById('timer');
    const readyButton = document.getElementById('ready-button');

    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session');

    if (!sessionId) {
      console.error('No session ID provided');
      window.location.href = '/tournament';
      return;
    }

    tournamentRepository.setSessionId(sessionId);

    try {
      await tournamentRepository.connect(handleWebSocketMessage);
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      window.location.href = '/tournament';
      return;
    }

    function handleWebSocketMessage(data: any) {
      if (!data || !data.type) {
        console.error('Invalid message format', data);
        return;
      }

      switch (data.type) {
        case 'timer_update':
          if (timerElement) {
            timerElement.textContent = data.remaining.toString();
          }
          break;
        case 'ready_state':
          // 再接続時などに現在のready状態を反映
          if (readyButton && data.isReady !== isReady) {
            isReady = data.isReady;
            readyButton.textContent = isReady ? 'Cancel Ready' : 'Ready';
            readyButton.classList.toggle('ready', isReady);
          }
          break;
        case 'session_invalid':
        case 'ready_failed':
        case 'error':
          window.location.href = '/tournament';
          break;
        case 'all_ready':
          window.location.href = `/tournament/game?session=${sessionId}`;
          break;
        case 'user_disconnected':
          // 他のユーザーが切断した場合の処理は変更なし
          window.location.href = '/tournament';
          break;
      }
    }

    if (readyButton) {
      readyButton.addEventListener('click', () => {
        isReady = !isReady;
        readyButton.textContent = isReady ? 'Cancel Ready' : 'Ready';
        readyButton.classList.toggle('ready', isReady);

        tournamentRepository.sendReady(isReady);
      });
    }

    return () => {
      if (tournamentRepository.isConnected()) {
        // 切断時は自動的にunready状態になるため、
        // 明示的なsendReadyは不要に
        tournamentRepository.disconnect();
      }
    };
  },
});

export default ReadyPage;
