import { WS_URL } from '@/config/config';
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';

const WaitingPage = new Page({
  name: 'MultiPlay/Waiting',
  config: {
    layout: CommonLayout,
    html: '/src/pages/MultiPlay/Waiting/index.html',
  },
  mounted: async ({ pg }: { pg: Page }): Promise<void> => {
    console.log('Waiting page mounting...');
    let socket: WebSocket | null = null;

    // DOM要素の取得
    const statusElement = document.getElementById('connection-status');
    const cancelButton = document.getElementById('cancel-button');

    // WebSocketを安全にクローズするヘルパー関数
    const closeSocket = () => {
      if (socket) {
        socket.close();
        socket = null;
      }
    };

    // ブラウザの戻る/進むに合わせて接続を切断
    window.addEventListener('popstate', closeSocket);

    // WebSocket初期化処理
    const initWebSocket = () => {
      console.log('Initializing WebSocket...');
      socket = new WebSocket(`${WS_URL}/ws/matchmaking/`);

      socket.onopen = () => {
        console.log('WebSocket connection established');
        const username = localStorage.getItem('username');
        if (!username) {
          console.error('No username found');
          window.location.href = '/multiplay';
          return;
        }
        // マッチメイキング参加メッセージの送信
        socket!.send(
          JSON.stringify({
            type: 'join_matchmaking',
            username,
          })
        );
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received websocket message:', data);

          switch (data.type) {
            case 'waiting':
              if (statusElement) statusElement.textContent = data.message;
              break;
            case 'match_found': {
              console.log('Match found:', data);
              const username = localStorage.getItem('username');
              const gameUrl = `/multiplay/game?session=${data.session_id}&isPlayer1=${username === data.player1}`;
              console.log('Navigating to:', gameUrl);
              window.location.href = gameUrl;
              break;
            }
            default:
              break;
          }
        } catch (e) {
          console.error('Error parsing message:', e);
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (statusElement) statusElement.textContent = 'Connection error. Retrying...';
      };

      socket.onclose = () => {
        console.log('WebSocket connection closed');
        if (statusElement) statusElement.textContent = 'Connection lost. Reconnecting...';
        // 5秒後に再接続を試行
        setTimeout(initWebSocket, 5000);
      };
    };

    // キャンセルボタンのクリック処理
    cancelButton?.addEventListener('click', () => {
      closeSocket();
      window.location.href = '/multiplay';
    });

    // WebSocket接続開始
    initWebSocket();

    // クリーンアップ処理
    return () => {
      closeSocket();
      window.removeEventListener('popstate', closeSocket);
    };
  },
});

export default WaitingPage;
