// frontend/src/pages/MultiPlay/Waiting/index.ts
import { WS_URL } from '@/config/config';
import i18next from '@/config/i18n';
import { Page } from '@/core/Page';
import AuthLayout from '@/layouts/AuthLayout';
import { ICurrentUser } from '@/libs/Auth/currnetUser';
import { setUserLanguage } from '@/utils/language';
import { updateText } from '@/utils/updateElements';

const updatePageContent = (): void => {
  updateText('title', i18next.t('multiplay.waiting.pageTitle'));
  updateText('.waiting-container h1', i18next.t('multiplay.waiting.heading'));
  updateText('#connection-status', i18next.t('multiplay.waiting.connectionStatus'));
  updateText('#cancel-button', i18next.t('multiplay.waiting.cancelButton'));
};

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
const handleSocketMessage = (
  event: MessageEvent,
  statusElement: HTMLElement | null,
  user: ICurrentUser
): void => {
  try {
    const data = JSON.parse(event.data);
    console.log('Received websocket message:', data);

    switch (data.type) {
      case 'waiting':
        if (statusElement) statusElement.textContent = data.message;
        break;
      case 'match_found': {
        console.log('Match found:', data);
        const username = user.username;
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
const initWebSocket = (statusElement: HTMLElement | null, user: ICurrentUser): WebSocket => {
  console.log('Initializing WebSocket...');
  const socket = new WebSocket(`${WS_URL}/wss/matchmaking/`);

  socket.onopen = () => {
    console.log('WebSocket connection established');
    // マッチメイキング参加メッセージの送信
    socket.send(
      JSON.stringify({
        type: 'join_matchmaking',
        username: user.username,
      })
    );
  };

  socket.onmessage = (event) => handleSocketMessage(event, statusElement, user);

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
    if (statusElement) statusElement.textContent = 'Connection error. Retrying...';
  };

  socket.onclose = () => {
    console.log('WebSocket connection closed');
    if (statusElement) statusElement.textContent = 'Connection lost. Reconnecting...';
    // 5秒後に再接続を試行
    setTimeout(() => {
      initWebSocket(statusElement, user);
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
    layout: AuthLayout,
    html: '/src/pages/MultiPlay/Waiting/index.html',
  },
  mounted: async ({ pg, user }) => {
    setUserLanguage(user.language, updatePageContent);
    pg.logger.info('Waiting page mounting...');
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
    socket = initWebSocket(statusElement, user);

    // クリーンアップ処理
    return () => {
      socket = closeSocket(socket);
      window.removeEventListener('popstate', onPopState);
    };
  },
});

export default WaitingPage;
