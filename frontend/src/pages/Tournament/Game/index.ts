// frontend/src/pages/Tournament/Game/index.ts
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { GameRenderer } from '@/pages/MultiPlay/Game/game_renderer';
import { WS_URL } from '@/config/config';

const TournamentGamePage = new Page({
  name: 'Tournament/Game',
  config: {
    layout: CommonLayout,
  },
  mounted: async ({ pg }) => {
    // パラメータの取得と検証
    const urlParams = new URLSearchParams(window.location.search);
    const tournamentId = urlParams.get('id');
    const username = localStorage.getItem('username');

    if (!tournamentId || !username) {
      console.error('Missing required params:', { tournamentId, username });
      window.location.href = '/tournament';
      return;
    }

    // ゲームコンテナの取得
    const container = document.getElementById('game-canvas');
    if (!container) {
      console.error('Game container not found');
      return;
    }

    // 現在のマッチを取得して、player1かどうかを判定
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/current-match`);
      if (!response.ok) throw new Error('Failed to fetch match info');
      const matchData = await response.json();
      const isPlayer1 = matchData.player1 === username;

      // GameRendererの初期化（MultiPlayと同じレンダラーを使用）
      const renderer = new GameRenderer(container, isPlayer1);
      const keyState = {
        ArrowLeft: false,
        ArrowRight: false,
      };

      // WebSocket接続
      const socket = new WebSocket(`${WS_URL}/ws/tournament/${tournamentId}/game/${username}/`);
      let wsConnected = false;

      socket.onopen = () => {
        console.log('Game WebSocket connected');
        wsConnected = true;
      };

      socket.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'state_update') {
            renderer.updateState(data.state);
            updateScoreBoard(data.state.score);

            if (!data.state.is_active) {
              // 試合終了時の処理
              socket.close();
              const scores = {
                player1: data.state.score[matchData.player1],
                player2: data.state.score[matchData.player2],
                opponent: username === matchData.player1 ? matchData.player2 : matchData.player1
              };
              localStorage.setItem('finalScore', JSON.stringify(scores));

              // トーナメントの次の試合または結果ページへ
              window.location.href = `/tournament/waiting?id=${tournamentId}`;
            }
          }
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
        }
      };

      // キー入力の処理はMultiPlayと同じ
      const handleKeyChange = (e: KeyboardEvent, isPressed: boolean) => {
        if (!wsConnected) return;

        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          keyState[e.key] = isPressed;
          e.preventDefault();

          const currentX = renderer.getPaddlePosition(username) ?? 0;
          const moveAmount = 10;
          let movement = 0;

          if (keyState.ArrowLeft) movement -= moveAmount;
          if (keyState.ArrowRight) movement += moveAmount;

          if (!isPlayer1) movement *= -1;

          const newPosition = currentX + movement;

          if (movement !== 0) {
            socket.send(JSON.stringify({
              type: 'move',
              position: newPosition,
            }));
          }
        }
      };

      // キーイベントリスナーの設定
      document.addEventListener('keydown', e => handleKeyChange(e, true));
      document.addEventListener('keyup', e => handleKeyChange(e, false));

      // クリーンアップ関数を返す
      return () => {
        document.removeEventListener('keydown', e => handleKeyChange(e, true));
        document.removeEventListener('keyup', e => handleKeyChange(e, false));
        socket.close();
        renderer.dispose();
      };

    } catch (error) {
      console.error('Error setting up game:', error);
      window.location.href = '/tournament';
    }

    function updateScoreBoard(score: any) {
      const scoreBoard = document.getElementById('score-board');
      if (!scoreBoard) return;

      const [player1Name, player2Name] = Object.keys(score);
      const player1Score = score[player1Name] || 0;
      const player2Score = score[player2Name] || 0;
      scoreBoard.textContent = `${player1Score} - ${player2Score}`;
    }
  },
});

export default TournamentGamePage;