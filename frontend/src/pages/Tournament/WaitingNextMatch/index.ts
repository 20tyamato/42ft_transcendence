// frontend/src/pages/Tournament/WaitingNextMatch/index.ts
import { WS_URL } from '@/config/config';
import { Page } from '@/core/Page';
import { logger } from '@/core/Logger';
import AuthLayout from '@/layouts/AuthLayout';

const WaitingNextMatchPage = new Page({
  name: 'Tournament/WaitingNextMatch',
  config: {
    layout: AuthLayout,
    html: '/src/pages/Tournament/WaitingNextMatch/index.html',
  },
  mounted: async ({ pg, user }) => {
    logger.info('Tournament waiting next match page mounting...');

    // URLパラメーターの取得
    const urlParams = new URLSearchParams(window.location.search);
    const tournamentId = urlParams.get('tournamentId');

    if (!tournamentId) {
      logger.error('Tournament ID not provided');
      window.location.href = '/tournament';
      return;
    }

    // DOM要素の取得
    const statusMessage = document.getElementById('status-message');
    const completedCount = document.getElementById('completed-count');
    const yourName = document.getElementById('your-name');
    const finalistsContainer = document.getElementById('finalists-container');
    const cancelButton = document.getElementById('cancel-button');

    // 現在のユーザー名を表示
    if (yourName && user.username) {
      yourName.textContent = user.display_name || user.username;
    }

    // キャンセルボタンのイベントリスナー
    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        if (socket) socket.close();
        window.location.href = '/tournament';
      });
    }

    // WebSocket接続変数
    let socket: WebSocket | null = null;
    const reconnectTimeout: number | null = null;

    // WebSocket接続関数
    const connectWebSocket = () => {
      if (socket) {
        socket.close();
      }

      const wsEndpoint = `${WS_URL}/wss/tournament/waiting_final/${tournamentId}/${user.username}/`;

      socket = new WebSocket(wsEndpoint);

      socket.onopen = () => {
        logger.info('Connected to waiting final WebSocket');
        if (statusMessage) {
          statusMessage.textContent = 'Connected. Waiting for other semi-final to complete...';
        }

        // 接続成功時にステータス要求メッセージを送信
        socket.send(
          JSON.stringify({
            type: 'request_status',
            tournament_id: tournamentId,
            username: user.username,
          })
        );
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          logger.info('Received message:', data);

          switch (data.type) {
            case 'waiting_status':
              updateWaitingStatus(data);
              break;

            case 'final_ready':
              handleFinalReady(data);
              break;

            case 'error':
              if (statusMessage) {
                statusMessage.textContent = `Error: ${data.message}`;
              }
              break;
          }
        } catch (e) {
          logger.error('Error parsing WebSocket message:', e);
        }
      };

      socket.onerror = (error) => {
        logger.error('WebSocket error:', error);
        if (statusMessage) {
          statusMessage.textContent = 'Connection error. Retrying...';
        }
      };

      socket.onclose = (event) => {
        logger.info('WebSocket closed:', event);
        if (statusMessage) {
          statusMessage.textContent = 'Connection lost. Reconnecting...';
        }

        // 再接続を試行（5秒後）
        // if (reconnectTimeout) {
        //   window.clearTimeout(reconnectTimeout);
        // }
        // reconnectTimeout = window.setTimeout(connectWebSocket, 5000);
      };
    };

    // 待機ステータス更新
    const updateWaitingStatus = (data: any) => {
      if (completedCount) {
        completedCount.textContent = data.completed_semifinals.toString();
      }

      if (finalistsContainer) {
        // 既存のリストをクリア
        finalistsContainer.innerHTML = '';

        // 自分自身のエントリーを追加
        const selfItem = document.createElement('li');
        selfItem.className = 'player-item you';
        selfItem.innerHTML = `
          <span class="player-tag">YOU</span>
          <span class="player-name">${user.display_name || user.username}</span>
          <span class="status-tag ready">Ready</span>
        `;
        finalistsContainer.appendChild(selfItem);

        // 他の決勝進出者（いる場合）
        if (data.finalists && data.finalists.length > 0) {
          data.finalists.forEach((finalist: any) => {
            if (finalist.username !== user.username) {
              const finalistItem = document.createElement('li');
              finalistItem.className = 'player-item';
              finalistItem.innerHTML = `
                <span class="player-name">${finalist.display_name || finalist.username}</span>
                <span class="status-tag ready">Ready</span>
              `;
              finalistsContainer.appendChild(finalistItem);
            }
          });
        } else {
          // 他の決勝進出者がまだいない場合
          const waitingItem = document.createElement('li');
          waitingItem.className = 'player-item waiting';
          waitingItem.innerHTML = `
            <span class="player-name">Waiting for opponent...</span>
            <span class="status-tag waiting">Waiting</span>
          `;
          finalistsContainer.appendChild(waitingItem);
        }
      }

      if (statusMessage) {
        if (data.all_semifinals_completed) {
          statusMessage.textContent = 'All semi-finals completed. Preparing final match...';
        } else {
          statusMessage.textContent = 'Waiting for other semi-final to complete...';
        }
      }
    };

    // 決勝戦準備完了処理
    const handleFinalReady = (data: any) => {
      if (statusMessage) {
        statusMessage.textContent = 'Final match is ready! Redirecting...';
      }

      // 決勝戦ページへリダイレクト
      setTimeout(() => {
        window.location.href = `/tournament/game?tournamentId=${tournamentId}&round=final&session=${data.session_id}&isPlayer1=${data.is_player1}`;
      }, 2000);
    };

    // WebSocket接続開始
    connectWebSocket();

    // ページアンマウント時のクリーンアップ
    return () => {
      logger.info('Tournament waiting next match page unmounting...');
      if (reconnectTimeout) {
        window.clearTimeout(reconnectTimeout);
      }
      if (socket) {
        socket.close();
      }
    };
  },
});

export default WaitingNextMatchPage;
