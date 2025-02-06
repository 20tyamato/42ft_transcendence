// frontend/src/pages/MultiPlay/Waiting/index.ts
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { WS_URL } from '@/config/config';
import './style.css';

const WaitingPage = new Page({
  name: 'MultiPlay/Waiting',
  config: {
    layout: CommonLayout,
    html: '/src/pages/MultiPlay/Waiting/index.html',
  },
  mounted: async () => {
    console.log('Waiting page mounting...');
    let socket: WebSocket | null = null;

    // DOM要素の取得
    const statusElement = document.getElementById('connection-status');
    const cancelButton = document.getElementById('cancel-button');

    function initWebSocket() {
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

        // 接続時にマッチメイキング参加のメッセージを送信（usernameを含める）
        socket.send(JSON.stringify({
          type: 'join_matchmaking',
          username: username
        }));
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received websocket message:', data);

          if (data.type === 'waiting') {
            if (statusElement) {
              statusElement.textContent = data.message;
            }
          } else if (data.type === 'match_found') {
            console.log('Match found:', data);
            const username = localStorage.getItem('username');
            // player1とplayer2の情報も受け取るように
            const gameUrl = `/multiplay/game?session=${data.session_id}&isPlayer1=${username === data.player1}`;
            console.log('Navigating to:', gameUrl);
            window.location.href = gameUrl;
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
        // 5秒後に再接続を試みる
        setTimeout(initWebSocket, 5000);
      };
    }

    // キャンセルボタンのイベントリスナー
    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        if (socket) {
          socket.close();
        }
        window.location.href = '/multiplay';
      });
    }

    // WebSocket接続開始
    initWebSocket();

    // クリーンアップ
    return () => {
      if (socket) {
        socket.close();
        socket = null;
      }
    };
  },
});

export default WaitingPage;