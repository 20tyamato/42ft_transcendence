// frontend/src/pages/MultiPlay/Waiting/index.ts
import { WS_URL } from '@/config/config';
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';

/**
 * DOM要素の取得
 */
const getDomElements = (): {
  statusElement: HTMLElement | null;
  cancelButton: HTMLElement | null;
} => {
  return {
    statusElement: document.getElementById('connection-status'),
    cancelButton: document.getElementById('cancel-button'),
  };
};

/**
 * WebSocketを安全にクローズする
 */
const closeSocket = (socket: WebSocket | null): WebSocket | null => {
  if (socket) {
    socket.close();
  }
  return null;
};

/**
 * WebSocketのメッセージ受信ハンドラ
 */
const handleSocketMessage = (event: MessageEvent, statusElement: HTMLElement | null): void => {
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
        if (!username) {
          console.error('No username found');
          window.location.href = '/multiplay';
          return;
        }
        const gameUrl = `/multiplay/game?session=${data.session_id}&isPlayer1=${
          username === data.player1
        }`;
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

/**
 * WebSocket接続の初期化
 */
const initWebSocket = (statusElement: HTMLElement | null): WebSocket => {
  console.log('Initializing WebSocket...');
  const socket = new WebSocket(`${WS_URL}/ws/matchmaking/`);

  socket.onopen = () => {
    console.log('WebSocket connection established');
    const username = localStorage.getItem('username');
    if (!username) {
      console.error('No username found');
      window.location.href = '/multiplay';
      return;
    }
    // マッチメイキング参加メッセージの送信
    socket.send(
      JSON.stringify({
        type: 'join_matchmaking',
        username,
      })
    );
  };

  socket.onmessage = (event) => handleSocketMessage(event, statusElement);

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
    if (statusElement) statusElement.textContent = 'Connection error. Retrying...';
  };

  socket.onclose = () => {
    console.log('WebSocket connection closed');
    if (statusElement) statusElement.textContent = 'Connection lost. Reconnecting...';
    // 5秒後に再接続を試行
    setTimeout(() => {
      initWebSocket(statusElement);
    }, 5000);
  };

  return socket;
};

/**
 * キャンセルボタンのクリック処理を設定
 */
const setupCancelButton = (cancelButton: HTMLElement | null, closeSocketFn: () => void): void => {
  if (cancelButton) {
    cancelButton.addEventListener('click', () => {
      closeSocketFn();
      window.location.href = '/multiplay';
    });
  }
};

const WaitingPage = new Page({
  name: 'MultiPlay/Waiting',
  config: {
    layout: CommonLayout,
    html: '/src/pages/MultiPlay/Waiting/index.html',
  },
  mounted: async ({ pg }: { pg: Page }): Promise<void> => {
    console.log('Waiting page mounting...');
    let socket: WebSocket | null = null;
    const { statusElement, cancelButton } = getDomElements();

    // ブラウザの戻る/進むに合わせた接続切断処理
    const onPopState = () => {
      socket = closeSocket(socket);
    };
    window.addEventListener('popstate', onPopState);

    // キャンセルボタンの設定
    setupCancelButton(cancelButton, () => {
      socket = closeSocket(socket);
    });

    // WebSocket接続開始
    socket = initWebSocket(statusElement);

    // クリーンアップ処理
    return () => {
      socket = closeSocket(socket);
      window.removeEventListener('popstate', onPopState);
    };
  },
});

export default WaitingPage;
