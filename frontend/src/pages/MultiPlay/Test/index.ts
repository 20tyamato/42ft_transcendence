import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import './style.css';

const WebSocketTestPage = new Page({
  name: 'WebSocket Test',
  config: {
    layout: CommonLayout,
  },
  mounted: async () => {
    let socket: WebSocket | null = null;
    const statusElement = document.getElementById('connection-status');
    const messageList = document.getElementById('message-list');

    // WebSocket接続の初期化
    function initWebSocket() {
      socket = new WebSocket('ws://localhost:8000/ws/test/');

      socket.onopen = () => {
        console.log('WebSocket connection established');
        if (statusElement) {
          statusElement.textContent = 'Connected';
          statusElement.style.color = 'green';
        }
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        addMessage(data.message);
        console.log('Message received:', data.message);
      };

      socket.onclose = () => {
        console.log('WebSocket connection closed');
        if (statusElement) {
          statusElement.textContent = 'Disconnected';
          statusElement.style.color = 'red';
        }
        // 3秒後に再接続を試みる
        setTimeout(() => initWebSocket(), 3000);
      };

      socket.onerror = (error) => {
        console.error('WebSocket error occurred:', error);
      };
    }

    function sendMessage(message: string) {
      if (!message.trim()) return;

      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            message: message,
          })
        );
      } else {
        console.error('WebSocket is not connected');
      }
    }

    function addMessage(message: string) {
      if (messageList) {
        const li = document.createElement('li');
        li.textContent = message;
        messageList.appendChild(li);
        messageList.scrollTop = messageList.scrollHeight;
      }
    }

    // イベントリスナーの設定
    const sendButton = document.getElementById('send-button');
    const messageInput = document.getElementById('message-input') as HTMLInputElement;

    sendButton?.addEventListener('click', () => {
      sendMessage(messageInput?.value || '');
      messageInput.value = '';
    });

    messageInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendMessage(messageInput.value);
        messageInput.value = '';
      }
    });

    // WebSocket接続の開始
    initWebSocket();

    // クリーンアップ関数を返す（ページ遷移時に実行される）
    return () => {
      if (socket) {
        socket.close();
        socket = null;
      }
    };
  },
});

export default WebSocketTestPage;
