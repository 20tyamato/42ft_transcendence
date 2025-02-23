import { WS_URL } from '@/config/config';
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';

const WaitingPage = new Page({
  name: 'Tournament/Waiting',
  config: {
    layout: CommonLayout,
    html: '/src/pages/Tournament/Waiting/index.html',
  },
  mounted: async () => {
    console.log('Tournament waiting page mounting...');
    let socket: WebSocket | null = null;

    // DOM要素の取得
    const statusElement = document.getElementById('connection-status');
    const cancelButton = document.getElementById('cancel-button');

    // WebSocketの切断と遷移を行う関数
    const handleNavigation = () => {
      if (socket) {
        socket.close();
        socket = null;
      }
    };

    // ブラウザの戻る/進むボタン対応
    window.addEventListener('popstate', handleNavigation);

    function initWebSocket() {
      console.log('Initializing Tournament WebSocket...');
      socket = new WebSocket(`${WS_URL}/ws/tournament/`);

      socket.onopen = () => {
        console.log('WebSocket connection established');
        const username = localStorage.getItem('username');
        if (!username) {
          console.error('No username found');
          window.location.href = '/tournament';
          return;
        }

        // トーナメント参加のメッセージを送信
        socket.send(
          JSON.stringify({
            type: 'join_tournament',
            username: username,
          })
        );
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received tournament message:', data);

          if (data.type === 'tournament_status') {
            if (statusElement) {
              statusElement.textContent = `Waiting for players... (${data.participants.length}/4)`;
            }
          } else if (data.type === 'tournament_ready') {
            console.log('Tournament ready:', data);
            // セッションIDを使用して準決勝のゲームページへ遷移
            window.location.href = `/tournament/game?session=${data.sessionId}`;
          }
        } catch (e) {
          console.error('Error parsing message:', e);
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (statusElement) {
          statusElement.textContent = 'Connection error. Retrying...';
        }
      };

      socket.onclose = () => {
        console.log('WebSocket connection closed');
        if (statusElement) {
          statusElement.textContent = 'Connection lost. Reconnecting...';
        }
        setTimeout(initWebSocket, 5000);
      };
    }

    // キャンセルボタンのイベントリスナー
    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        handleNavigation();
        window.location.href = '/tournament';
      });
    }

    // WebSocket接続開始
    initWebSocket();

    // クリーンアップ
    return () => {
      handleNavigation();
      window.removeEventListener('popstate', handleNavigation);
    };
  },
});

export default WaitingPage;