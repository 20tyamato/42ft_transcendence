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
        if (statusElement) {
          statusElement.textContent = 'Looking for opponent...';
          statusElement.style.color = 'green';
        }
        socket.send(JSON.stringify({
          type: 'join_matchmaking'
        }));
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received message:', data);
    
          if (data.type === 'waiting') {
            if (statusElement) {
              statusElement.textContent = data.message;
            }
          } else if (data.type === 'match_found') {
            console.log('Match found! Session ID:', data.session_id);
            // マッチング成立時の処理
            window.location.href = `/multiplay/game?session=${data.session_id}`;
          }
        } catch (e) {
          console.error('Error parsing message:', e);
        }
      };

      socket.onclose = () => {
        console.log('WebSocket connection closed');
        if (statusElement) {
          statusElement.textContent = 'Connection lost';
          statusElement.style.color = 'red';
        }
        // 3秒後に再接続
        setTimeout(() => initWebSocket(), 3000);
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    }

    // キャンセルボタンのイベントリスナー
    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        if (socket) {
          socket.close();
        }
        window.location.href = '/multiplay';  // マルチプレイのメインページに戻る
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