import { WS_URL } from '@/config/config';
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { GameRenderer } from './game_renderer';

const GamePage = new Page({
  name: 'MultiPlay/Game',
  config: { layout: CommonLayout },
  mounted: async ({ pg }: { pg: Page }): Promise<void> => {
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

    // ヘルパー関数
    const getPlayerNames = (): [string, string] => {
      return sessionId.replace('game_', '').split('_') as [string, string];
    };

    const getOpponent = (): string => {
      const [player1Name, player2Name] = getPlayerNames();
      return username === player1Name ? player2Name : player1Name;
    };

    const finishGame = async (finalScore: any) => {
      localStorage.setItem('finalScore', JSON.stringify(finalScore));
      localStorage.setItem('gameMode', 'multiplayer');
      await new Promise<void>((resolve) => setTimeout(resolve, 1000));
      window.location.href = '/result';
    };

    const updateScoreBoard = (score: any) => {
      const scoreBoard = document.getElementById('score-board');
      if (scoreBoard) {
        const playerScore = score[username] || 0;
        const opponentScore = Object.entries(score).find(([id]) => id !== username)?.[1] || 0;
        scoreBoard.textContent = isPlayer1
          ? `${playerScore} - ${opponentScore}`
          : `${opponentScore} - ${playerScore}`;
      }
    };

    // ゲームコンテナの取得
    const container = document.getElementById('game-canvas');
    if (!container) {
      console.error('Game container not found');
      return;
    }

    // レンダラーと初期状態の設定
    const renderer = new GameRenderer(container, isPlayer1);
    const keyState: { [key: string]: boolean } = {
      ArrowLeft: false,
      ArrowRight: false,
    };

    // WebSocket 接続の設定
    const socket = new WebSocket(`${WS_URL}/ws/game/${sessionId}/${username}/`);
    let wsConnected = false;

    socket.onopen = () => {
      console.log('Game WebSocket connected');
      wsConnected = true;
    };

    socket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case 'state_update': {
            renderer.updateState(data.state);
            updateScoreBoard(data.state.score);
            if (!data.state.is_active) {
              const opponent = getOpponent();
              const finalScore = {
                player1: data.state.score[username],
                player2: data.state.score[opponent],
                opponent,
              };
              await finishGame(finalScore);
            }
            break;
          }
          case 'player_disconnected': {
            const opponent = getOpponent();
            const finalScore = {
              player1: data.state?.score?.[username] ?? 15,
              player2: data.state?.score?.[opponent] ?? 0,
              opponent,
              disconnected: true,
              disconnectedPlayer: data.disconnected_player,
            };
            await finishGame(finalScore);
            break;
          }
          default:
            break;
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
      const opponent = getOpponent();
      const finalScore = {
        player1: 0,
        player2: 15,
        opponent,
        disconnected: true,
        disconnectedPlayer: username,
      };
      localStorage.setItem('finalScore', JSON.stringify(finalScore));
      localStorage.setItem('gameMode', 'multiplayer');
      window.location.href = '/result';
    };

    // キー入力の状態管理
    const handleKeyChange = (e: KeyboardEvent, isPressed: boolean) => {
      if (!wsConnected) return;

      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        keyState[e.key] = isPressed;
        e.preventDefault();

        const currentX = renderer.getPaddlePosition(username) ?? 0;
        const moveAmount = 10;
        let movement =
          (keyState.ArrowRight ? moveAmount : 0) - (keyState.ArrowLeft ? moveAmount : 0);

        if (!isPlayer1) {
          movement *= -1;
        }

        const newPosition = currentX + movement;

        if (movement !== 0) {
          const moveMessage = {
            type: 'move',
            username,
            position: newPosition,
          };
          socket.send(JSON.stringify(moveMessage));
          console.log('Sending move:', moveMessage);
        }
      }
    };

    const keydown = (e: KeyboardEvent) => handleKeyChange(e, true);
    const keyup = (e: KeyboardEvent) => handleKeyChange(e, false);

    document.addEventListener('keydown', keydown);
    document.addEventListener('keyup', keyup);

    // クリーンアップ処理
    return () => {
      document.removeEventListener('keydown', keydown);
      document.removeEventListener('keyup', keyup);
      socket.close();
      renderer.dispose();
    };
  },
});

export default GamePage;
