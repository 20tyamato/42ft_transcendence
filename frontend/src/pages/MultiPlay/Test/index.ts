import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import './style.css';

const WebSocketTestPage = new Page({
  name: 'MultiPlay/Test', // パスを修正
  config: {
    layout: CommonLayout,
    html: '/src/pages/MultiPlay/Test/index.html', // パスを明示的に指定
  },
  mounted: async () => {
    console.log('WebSocketTest page mounting...');
    let socket: WebSocket | null = null;

    // DOM要素の取得を確認
    const statusElement = document.getElementById('connection-status');
    console.log('Status element found:', !!statusElement);

    const messageList = document.getElementById('message-list');
    console.log('Message list element found:', !!messageList);

    const messageInput = document.getElementById('message-input') as HTMLInputElement;
    console.log('Message input element found:', !!messageInput);

    const sendButton = document.getElementById('send-button');
    console.log('Send button element found:', !!sendButton);

    // WebSocket接続の初期化
    function initWebSocket() {
      console.log('Initializing WebSocket...');
      socket = new WebSocket('ws://localhost:8000/ws/test/');

      socket.onopen = () => {
        console.log('WebSocket connection established');
        if (statusElement) {
          statusElement.textContent = 'Connected';
          statusElement.style.color = 'green';
        }
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          addMessage(data.message);
          console.log('Message received:', data.message);
        } catch (e) {
          console.error('Error parsing message:', e);
        }
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
      } else {
        console.error('Message list element not found');
      }
    }

    // イベントリスナーの設定
    if (sendButton && messageInput) {
      console.log('Setting up event listeners...');
      sendButton.addEventListener('click', () => {
        sendMessage(messageInput.value);
        messageInput.value = '';
      });

      messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          sendMessage(messageInput.value);
          messageInput.value = '';
        }
      });
    } else {
      console.error('Required elements not found for event listeners');
    }

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
