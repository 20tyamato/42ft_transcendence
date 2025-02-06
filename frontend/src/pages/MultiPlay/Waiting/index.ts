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
    console.log('Initializing WebSocket...'); // デバッグ出力追加
    socket = new WebSocket(`${WS_URL}/ws/matchmaking/`);

    socket.onopen = () => {
        console.log('WebSocket connection established'); // デバッグ出力追加
        // 接続時にマッチメイキング参加のメッセージを送信
        socket.send(JSON.stringify({
            type: 'join_matchmaking'
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
              console.log('Match found with session:', data.session_id); // 追加
              const gameUrl = `/multiplay/game?session=${data.session_id}`;
              console.log('Generated URL:', gameUrl); // 追加
              
              // 遷移前に少し待機して確実にログを確認できるようにする
              setTimeout(() => {
                  console.log('Navigating to:', gameUrl); // 追加
                  window.location.href = gameUrl;
              }, 2000);
          }
      } catch (e) {
          console.error('Error parsing message:', e);
      }
    };

    socket.onerror = (error) => {
        console.error('WebSocket error:', error); // デバッグ出力追加
    };

    socket.onclose = () => {
        console.log('WebSocket connection closed'); // デバッグ出力追加
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