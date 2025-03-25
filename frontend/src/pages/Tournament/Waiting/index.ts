// frontend/src/pages/Tournament/Waiting/index.ts
import { WS_URL } from '@/config/config';
import i18next from '@/config/i18n';
import { logger } from '@/core/Logger';
import { Page } from '@/core/Page';
import AuthLayout from '@/layouts/AuthLayout';
import { setUserLanguage } from '@/utils/language';
import { updateText } from '@/utils/updateElements';

const updatePageContent = (): void => {
  updateText('title', i18next.t('tournament.waiting.pageTitle'));
  updateText('.card-header h2', i18next.t('tournament.waiting.roomTitle'));
  updateText('#connection-status', i18next.t('tournament.waiting.connectionStatus'));
  updateText('.players-list h4', i18next.t('tournament.waiting.participantsHeader'));
  updateText('#leave-button', i18next.t('tournament.waiting.leaveButton'));
};

const WaitingPage = new Page({
  name: 'Tournament/Waiting',
  config: {
    layout: AuthLayout,
    html: '/src/pages/Tournament/Waiting/index.html',
  },
  mounted: async ({ pg, user }): Promise<void> => {
    setUserLanguage(user.language, updatePageContent);
    logger.info('Tournament waiting page - initializing');

    // DOM要素の取得
    const connectionStatus = document.getElementById('connection-status');
    const playerCount = document.getElementById('current-players');
    const playersContainer = document.getElementById('players-container');
    const leaveButton = document.getElementById('leave-button');

    // WebSocket接続変数
    let socket: WebSocket | null = null;

    // WebSocketメッセージのハンドリング
    const handleSocketMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        logger.info('Received websocket message:', data);

        switch (data.type) {
          case 'error':
            if (connectionStatus)
              connectionStatus.textContent = i18next.t('tournament.waiting.error', {
                error: data.message,
              });
            break;

          case 'waiting_status':
            updateWaitingStatus(data);
            break;

          case 'tournament_match':
            handleMatchFound(data);
            break;
        }
      } catch (e) {
        logger.info('Error parsing message:', e);
      }
    };

    // 待機状態の更新
    const updateWaitingStatus = (data: any) => {
      // プレイヤー数の更新
      if (playerCount) {
        playerCount.textContent = data.total_players.toString();
      }

      // 接続ステータスの更新（例: "Waiting for X more players..."）
      if (connectionStatus) {
        connectionStatus.textContent = i18next.t('tournament.waiting.waitingPlayers', {
          count: Math.max(0, 4 - data.total_players),
        });
      }

      // プレイヤーリストの更新
      if (playersContainer) {
        playersContainer.innerHTML = '';

        data.players.forEach((player: any) => {
          const playerItem = document.createElement('li');
          playerItem.className = 'list-group-item player-item';

          // プレイヤー情報を構築（"Ready" の文言も翻訳キーで）
          playerItem.innerHTML = `
            <div class="player-name">${player.display_name || player.username}</div>
            <div class="ready-status ready-yes">${i18next.t('tournament.waiting.ready')}</div>
          `;

          playersContainer.appendChild(playerItem);
        });
      }
    };

    // マッチ発見時の処理
    const handleMatchFound = (data: any) => {
      logger.info('Match found!', data);

      if (connectionStatus) {
        connectionStatus.textContent = i18next.t('tournament.waiting.matchFound');
      }

      // 試合ページへリダイレクト
      setTimeout(() => {
        window.location.href = `/tournament/game?tournamentId=${data.tournament_id}&round=${data.match_type}&matchNumber=${data.match_number}&session=${data.session_id}&isPlayer1=${data.is_player1}`;
      }, 1500);
    };

    // WebSocketの初期化
    const initWebSocket = () => {
      // 既存の接続を閉じる
      if (socket) {
        socket.close();
      }

      socket = new WebSocket(`${WS_URL}/wss/tournament/`);

      socket.onopen = () => {
        logger.info('WebSocket connection established');

        // トーナメント参加メッセージの送信
        socket.send(
          JSON.stringify({
            type: 'join_tournament',
            username: user.username,
          })
        );

        if (connectionStatus) {
          connectionStatus.textContent = i18next.t('tournament.waiting.connectedPlayers');
        }
      };

      socket.onmessage = handleSocketMessage;

      socket.onerror = (error) => {
        logger.error('WebSocket error:', error);
        if (connectionStatus) {
          connectionStatus.textContent = i18next.t('tournament.waiting.connectionError');
        }
      };

      socket.onclose = () => {
        logger.info('WebSocket connection closed');
        if (connectionStatus) {
          connectionStatus.textContent = i18next.t('tournament.waiting.connectionLost');
        }

        // 3秒後に再接続
        setTimeout(initWebSocket, 3000);
      };
    };

    // 離脱ボタンのイベントハンドラ
    if (leaveButton) {
      leaveButton.addEventListener('click', () => {
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(
            JSON.stringify({
              type: 'leave_tournament',
              username: user.username,
            })
          );
        }

        window.location.href = '/tournament';
      });
    }

    // ブラウザの戻る/進むボタン対応
    const handlePopState = () => {
      if (socket) {
        socket.close();
        socket = null;
      }
    };
    window.addEventListener('popstate', handlePopState);

    // WebSocket接続開始
    initWebSocket();

    // クリーンアップ関数を返す
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (socket) {
        socket.close();
        socket = null;
      }
    };
  },
});

export default WaitingPage;
