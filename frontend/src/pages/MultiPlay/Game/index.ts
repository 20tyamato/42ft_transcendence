import { WS_URL } from '@/config/config';
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { GameRenderer } from './game_renderer';

const GamePage = new Page({
  name: 'MultiPlay/Game',
  config: {
    layout: CommonLayout,
  },
  mounted: async () => {
    // パラメータの取得と検証
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session');
    const isPlayer1 = urlParams.get('isPlayer1') === 'true';
    const username = localStorage.getItem('username');

    console.log('Game parameters:', { sessionId, isPlayer1, username });

    if (!sessionId || !username) {
      console.log('Missing required params:', { sessionId, username });
      await new Promise((resolve) => setTimeout(resolve, 2000));
      window.location.href = '/multiplay';
      return;
    }

    // ゲームコンテナの取得
    const container = document.getElementById('game-canvas');
    if (!container) {
      console.error('Game container not found');
      return;
    }

    // レンダラーの初期化
    const renderer = new GameRenderer(container, isPlayer1);
    const keyState = {
      ArrowLeft: false,
      ArrowRight: false,
    };

    // WebSocket接続
    const socket = new WebSocket(`${WS_URL}/ws/game/${sessionId}/${username}/`);
    let wsConnected = false;

    socket.onopen = () => {
      console.log('Game WebSocket connected');
      wsConnected = true;
    };

    socket.onmessage = async (event) => {
      // async を追加
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'state_update') {
          renderer.updateState(data.state);
          updateScoreBoard(data.state.score);

          if (!data.state.is_active) {
            // 確実にデータを処理するため、Promise を使用
            await new Promise<void>((resolve) => {
              const [player1Name, player2Name] = sessionId?.replace('game_', '').split('_') || [];
              const opponent = username === player1Name ? player2Name : player1Name;

              const finalScore = {
                player1: data.state.score[username],
                player2: data.state.score[opponent],
                opponent: opponent,
              };

              localStorage.setItem('finalScore', JSON.stringify(finalScore));
              localStorage.setItem('gameMode', 'multiplayer');

              setTimeout(() => {
                resolve();
                window.location.href = '/result';
              }, 1000);
            });
          }
        } else if (data.type === 'player_disconnected') {
          // 相手の切断を検知したら少し待ってからリザルト画面に遷移
          await new Promise<void>((resolve) => {
            const [player1Name, player2Name] = sessionId?.replace('game_', '').split('_') || [];
            const opponent = username === player1Name ? player2Name : player1Name;

            // 切断情報を含めた最終スコアを保存
            const finalScore = {
              player1: data.state?.score?.[username] ?? 15, // 切断時は残ったプレイヤーが15点
              player2: data.state?.score?.[opponent] ?? 0,
              opponent: opponent,
              disconnected: true, // 切断による終了を示すフラグ
              disconnectedPlayer: data.disconnected_player,
            };

            localStorage.setItem('finalScore', JSON.stringify(finalScore));
            localStorage.setItem('gameMode', 'multiplayer');

            // 少し待ってからリザルト画面に遷移
            setTimeout(() => {
              resolve();
              window.location.href = '/result';
            }, 1000);
          });
        }
      } catch (e) {
        console.error('Error in WebSocket message handler:', e);
      }
    };

    socket.onerror = (error) => {
      console.error('Game WebSocket error:', error);
      wsConnected = false;
    };

    socket.onclose = () => {
      console.log('Game WebSocket closed');
      wsConnected = false;

      // 自分が切断された場合（ネットワークエラーなど）の処理
      const [player1Name, player2Name] = sessionId?.replace('game_', '').split('_') || [];
      const opponent = username === player1Name ? player2Name : player1Name;

      const finalScore = {
        player1: 0, // 切断したプレイヤーは敗北
        player2: 15, // 相手が勝利
        opponent: opponent,
        disconnected: true,
        disconnectedPlayer: username, // 自分が切断したプレイヤー
      };

      localStorage.setItem('finalScore', JSON.stringify(finalScore));
      localStorage.setItem('gameMode', 'multiplayer');

      // リザルト画面に遷移
      window.location.href = '/result';
    };

    // キー入力の状態管理
    const handleKeyChange = (e: KeyboardEvent, isPressed: boolean) => {
      if (!wsConnected) return;

      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        keyState[e.key] = isPressed;
        e.preventDefault(); // ページのスクロールを防止

        // 現在のパドル位置を取得
        const currentX = renderer.getPaddlePosition(username) ?? 0;

        // 移動量の計算（プレイヤー2の場合は反転）
        const moveAmount = 10; // PADDLE_SPEEDと同じ値
        let movement = 0;

        if (keyState.ArrowLeft) movement -= moveAmount;
        if (keyState.ArrowRight) movement += moveAmount;

        // プレイヤー2の場合は移動方向を反転
        if (!isPlayer1) movement *= -1;

        const newPosition = currentX + movement;

        // 移動メッセージの送信
        if (movement !== 0) {
          const moveMessage = {
            type: 'move',
            username: username,
            position: newPosition,
          };
          socket.send(JSON.stringify(moveMessage));
          console.log('Sending move:', moveMessage);
        }
      }
    };

    // キーイベントリスナーの設定
    const keydown = (e: KeyboardEvent) => handleKeyChange(e, true);
    const keyup = (e: KeyboardEvent) => handleKeyChange(e, false);

    document.addEventListener('keydown', keydown);
    document.addEventListener('keyup', keyup);

    function updateScoreBoard(score: any) {
      const scoreBoard = document.getElementById('score-board');
      if (scoreBoard) {
        const playerScore = score[username] || 0;
        const opponentScore = Object.entries(score).find(([id]) => id !== username)?.[1] || 0;
        scoreBoard.textContent = isPlayer1
          ? `${playerScore} - ${opponentScore}`
          : `${opponentScore} - ${playerScore}`;
      }
    }

    // クリーンアップ関数を返す
    return () => {
      document.removeEventListener('keydown', keydown);
      document.removeEventListener('keyup', keyup);
      socket?.close();
      renderer.dispose();
    };
  },
});

export default GamePage;
