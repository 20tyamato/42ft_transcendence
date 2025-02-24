import { API_URL, WS_URL } from '@/config/config';
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { fetchUserAvatar } from '@/models/User/repository';
import { GameRenderer } from './game_renderer';

/**
 * URLやlocalStorageから必要なパラメータを取得する
 */
const extractGameParameters = (): {
  sessionId: string;
  isPlayer1: boolean;
  username: string;
} | null => {
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session');
  const isPlayer1 = urlParams.get('isPlayer1') === 'true';
  const username = localStorage.getItem('username');

  console.log('Game parameters:', { sessionId, isPlayer1, username });

  if (!sessionId || !username) {
    console.log('Missing required params:', { sessionId, username });
    return null;
  }
  return { sessionId, isPlayer1, username };
};

/**
 * セッションIDからプレイヤー名を取得する
 */
const getPlayerNames = (sessionId: string): [string, string] => {
  return sessionId.replace('game_', '').split('_') as [string, string];
};

/**
 * 自分と相手の名前から相手の名前を返す
 */
const getOpponent = (sessionId: string, username: string): string => {
  const [player1Name, player2Name] = getPlayerNames(sessionId);
  return username === player1Name ? player2Name : player1Name;
};

/**
 * ゲーム終了時の処理（スコア保存、リダイレクト）
 */
const finishGame = async (finalScore: any): Promise<void> => {
  localStorage.setItem('finalScore', JSON.stringify(finalScore));
  localStorage.setItem('gameMode', 'multiplayer');
  await new Promise<void>((resolve) => setTimeout(resolve, 1000));
  window.location.href = '/result';
};

/**
 * スコアボード初期化
 * － ゲーム開始時に一度だけユーザーと対戦相手のアバターアイコンを設定する
 */
const initializeScoreBoard = (username: string, opponentName: string): void => {
  const playerAvatarImg = document.getElementById('player-avatar') as HTMLImageElement;
  const opponentAvatarImg = document.getElementById('opponent-avatar') as HTMLImageElement;
  if (playerAvatarImg && opponentAvatarImg) {
    fetchUserAvatar(username).then((avatar) => {
      if (avatar && avatar.type.startsWith('image/')) {
        const avatarUrl = URL.createObjectURL(avatar);
        playerAvatarImg.src = avatarUrl;
      } else {
        playerAvatarImg.src = `${API_URL}/media/default_avatar.png`;
      }
    });
    playerAvatarImg.alt = username;
    fetchUserAvatar(opponentName).then((avatar) => {
      if (avatar && avatar.type.startsWith('image/')) {
        const avatarUrl = URL.createObjectURL(avatar);
        opponentAvatarImg.src = avatarUrl;
      } else {
        opponentAvatarImg.src = `${API_URL}/media/default_avatar.png`;
      }
    });
    opponentAvatarImg.alt = opponentName;
  }
};

/**
 * スコアボードの表示更新
 * － 毎回スコア部分のみを更新し、アバターアイコンは固定のままとなる
 */
const updateScoreBoard = (score: any, username: string): void => {
  const playerScoreValue = document.getElementById('player-score-value');
  const opponentScoreValue = document.getElementById('opponent-score-value');
  if (playerScoreValue && opponentScoreValue) {
    const playerScore = score[username] || 0;
    const opponentEntry = Object.entries(score).find(([id]) => id !== username);
    const opponentScore = opponentEntry ? opponentEntry[1] : 0;

    playerScoreValue.textContent = String(playerScore);
    opponentScoreValue.textContent = String(opponentScore);
  }
};

/**
 * WebSocketの初期化とイベントハンドラの設定
 */
const initializeWebSocket = (
  sessionId: string,
  username: string,
  isPlayer1: boolean,
  renderer: GameRenderer,
  getOpponentFn: () => string,
  cleanupOnDisconnect: (finalScore: any) => void
): WebSocket => {
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
          // 毎回 DOM 全体を書き換えず、スコアのみ更新
          updateScoreBoard(data.state.score, username);
          if (!data.state.is_active) {
            const opponent = getOpponentFn();
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
          const opponent = getOpponentFn();
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
    const opponent = getOpponentFn();
    const finalScore = {
      player1: 0,
      player2: 15,
      opponent,
      disconnected: true,
      disconnectedPlayer: username,
    };
    cleanupOnDisconnect(finalScore);
  };

  return socket;
};

/**
 * キー入力の状態管理とハンドラ設定
 */
const setupKeyHandlers = (
  socket: WebSocket,
  renderer: GameRenderer,
  username: string,
  isPlayer1: boolean
): { removeHandlers: () => void } => {
  let wsConnected = true;
  const keyState: { [key: string]: boolean } = {
    ArrowLeft: false,
    ArrowRight: false,
  };

  const handleKeyChange = (e: KeyboardEvent, isPressed: boolean) => {
    if (!wsConnected) return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      keyState[e.key] = isPressed;
      e.preventDefault();

      const currentX = renderer.getPaddlePosition(username) ?? 0;
      const moveAmount = 10;
      let movement = (keyState.ArrowRight ? moveAmount : 0) - (keyState.ArrowLeft ? moveAmount : 0);

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

  return {
    removeHandlers: () => {
      wsConnected = false;
      document.removeEventListener('keydown', keydown);
      document.removeEventListener('keyup', keyup);
    },
  };
};

const GamePage = new Page({
  name: 'MultiPlay/Game',
  config: { layout: CommonLayout },
  mounted: async ({ pg }: { pg: Page }): Promise<void> => {
    console.log('Game page mounting...');
    // パラメータ取得と検証
    const params = extractGameParameters();
    if (!params) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      window.location.href = '/multiplay';
      return;
    }
    const { sessionId, isPlayer1, username } = params;
    const opponentName = getOpponent(sessionId, username);
    const opponentFn = () => opponentName;

    // スコアボードの初期化（アバター設定を一度だけ実施）
    initializeScoreBoard(username, opponentName);

    // ゲームコンテナの取得
    const container = document.getElementById('game-canvas');
    if (!container) {
      console.error('Game container not found');
      return;
    }

    // レンダラーの初期化
    const renderer = new GameRenderer(container, isPlayer1);

    // 切断時のクリーンアップ処理
    const cleanupOnDisconnect = (finalScore: any) => {
      localStorage.setItem('finalScore', JSON.stringify(finalScore));
      localStorage.setItem('gameMode', 'multiplayer');
      window.location.href = '/result';
    };

    // WebSocket接続の初期化
    const socket = initializeWebSocket(
      sessionId,
      username,
      isPlayer1,
      renderer,
      opponentFn,
      cleanupOnDisconnect
    );

    // キー入力ハンドラの設定
    const keyHandlers = setupKeyHandlers(socket, renderer, username, isPlayer1);

    // クリーンアップ処理の返却
    return () => {
      keyHandlers.removeHandlers();
      socket.close();
      renderer.dispose();
    };
  },
});

export default GamePage;
