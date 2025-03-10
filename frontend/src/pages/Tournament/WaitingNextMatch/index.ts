// frontend/src/pages/Tournament/WaitingNextMatch/index.ts
import { WS_URL } from '@/config/config';
import { Page } from '@/core/Page';
import AuthLayout from '@/layouts/AuthLayout';
import { WebSocketService } from '@/models/Services/WebSocketService';

const WaitingNextMatchPage = new Page({
  name: 'Tournament/WaitingNextMatch',
  config: {
    layout: AuthLayout,
    html: '/src/pages/Tournament/WaitingNextMatch/index.html',
  },
  mounted: async ({ pg, user }) => {
    console.log('Tournament waiting next match page mounting...');

    let wsService: WebSocketService | null = null;

    // URLパラメータの取得と検証
    const urlParams = new URLSearchParams(window.location.search);
    const tournamentId = urlParams.get('session');
    const username = user.username;

    // DOM要素の取得
    const statusElement = document.getElementById('waiting-status');
    const playersList = document.getElementById('finalists-list');

    if (!tournamentId || !username) {
      console.error('Missing required parameters');
      window.location.href = '/tournament';
      return;
    }

    // WebSocketサービスの初期化
    wsService = new WebSocketService(() => {
      console.error('Connection error occurred');
      if (statusElement) {
        statusElement.textContent = 'Connection error. Please try again.';
      }
    });

    try {
      // WS接続
      const wsEndpoint = `${WS_URL}/ws/tournament/waiting_final/${tournamentId}/${username}/`;
      await wsService.connect(wsEndpoint);

      // メッセージハンドラの登録
      wsService.addMessageHandler('final_ready', (data) => {
        console.log('Final match ready:', data);

        // 決勝戦の情報取得
        const matchId = data.match?.id || '';
        const isPlayer1 = username === data.match?.player1;

        // ゲームページへ遷移
        const gameUrl = `/tournament/game?tournamentId=${tournamentId}&round=final&isPlayer1=${username === data.match?.player1}`;
        window.location.href = gameUrl;
      });

      wsService.addMessageHandler('waiting_update', (data) => {
        console.log('Waiting update:', data);

        if (statusElement) {
          statusElement.textContent = `Waiting for the other semi-final to complete...`;
        }

        // 決勝進出者リストの更新
        if (playersList && data.finalists) {
          playersList.innerHTML = '';
          data.finalists.forEach((finalist: { username: string; display_name: string }) => {
            const listItem = document.createElement('li');
            listItem.textContent = finalist.display_name || finalist.username;
            if (finalist.username === username) {
              listItem.classList.add('current-user');
            }
            playersList.appendChild(listItem);
          });
        }
      });

      wsService.addMessageHandler('error', (data) => {
        console.error('Error message received:', data);
        if (statusElement) {
          statusElement.textContent = `Error: ${data.message}`;
        }
      });

      // 初期状態を要求
      wsService.send({
        type: 'get_waiting_status',
        username: username,
      });
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      if (statusElement) {
        statusElement.textContent = 'Connection failed. Please try again.';
      }
    }

    // クリーンアップ関数を返す
    return () => {
      console.log('Tournament waiting next match page unmounting...');
      if (wsService) {
        wsService.disconnect();
      }
    };
  },
});

export default WaitingNextMatchPage;
