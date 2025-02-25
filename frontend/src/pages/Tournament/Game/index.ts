// frontend/src/pages/Tournament/Game/index.ts
import { WS_URL } from '@/config/config';
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { IGameState } from '@/models/interface';
import { GameRenderer } from '../../MultiPlay/Game/game_renderer';

const TournamentGamePage = new Page({
  name: 'Tournament/Game',
  config: {
    layout: CommonLayout,
  },
  mounted: async () => {
    // パラメータの取得と検証
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session');
    const isPlayer1 = urlParams.get('isPlayer1') === 'true';
    const matchId = urlParams.get('matchId');
    const round = parseInt(urlParams.get('round') || '0');
    const username = localStorage.getItem('username');

    console.log('Tournament game parameters:', { sessionId, isPlayer1, matchId, round, username });

    if (!sessionId || !username || !matchId) {
      console.log('Missing required params');
      await new Promise((resolve) => setTimeout(resolve, 2000));
      window.location.href = '/tournament';
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
    const wsEndpoint = round === 1 
      ? `${WS_URL}/ws/tournament/final/${sessionId}/${username}/`
      : `${WS_URL}/ws/tournament/semi-final/${sessionId}/${username}/`;

    console.log('Attempting WebSocket connection:', {
        wsEndpoint,
        sessionId,
        matchId,
        round,
        username,
        timestamp: new Date().toISOString()
      });
  
      // WebSocket作成前にreadyStateの確認用関数
    const logWebSocketState = (ws: WebSocket, event: string) => {
        console.log('WebSocket state:', {
          event,
          readyState: ws.readyState,
          // readyStateの意味を文字列で出力
          readyStateText: ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][ws.readyState],
          url: ws.url,
          timestamp: new Date().toISOString()
        });
      };
    
    const socket = new WebSocket(wsEndpoint);
    let wsConnected = false;

    // 接続試行の詳細なログ
    socket.onopen = () => {
      console.log('WebSocket connection successful:', {
        endpoint: socket.url,
        timestamp: new Date().toISOString()
      });
      logWebSocketState(socket, 'onopen');
      wsConnected = true;
    };

    socket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', {
          type: data.type,
          timestamp: new Date().toISOString(),
          data: data
        });
        
        switch (data.type) {
          case 'state_update':
            console.log('State update received:', {
              is_active: data.state.is_active,
              score: data.state.score,
              ball: data.state.ball,
              players: data.state.players,
              timestamp: new Date().toISOString()
            });
    
            renderer.updateState(data.state);
            updateScoreBoard(data.state.score);
    
            if (!data.state.is_active) {
              console.log('Game state became inactive:', {
                state: data.state,
                timestamp: new Date().toISOString()
              });
              await handleGameEnd(data);
            }
            break;
    
          case 'player_disconnected':
            console.log('Player disconnected:', {
              data: data,
              timestamp: new Date().toISOString()
            });
            await handleDisconnection(data);
            break;
    
          case 'game_end':
            console.log('Game end received:', {
              data: data,
              timestamp: new Date().toISOString()
            });
            await handleGameEnd(data);
            break;
        }
      } catch (e) {
        console.error('Error in WebSocket message handler:', {
          error: e,
          rawData: event.data,
          timestamp: new Date().toISOString()
        });
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket connection error:', {
        error,
        endpoint: wsEndpoint,
        socketState: {
          readyState: socket.readyState,
          readyStateText: ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][socket.readyState]
        },
        connectionParams: {
          sessionId,
          matchId,
          round,
          username
        },
        timestamp: new Date().toISOString()
      });
      logWebSocketState(socket, 'onerror');
      wsConnected = false;
    };

    socket.onclose = (event) => {
      console.log('WebSocket connection closed:', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
        socketState: {
          readyState: socket.readyState,
          readyStateText: ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][socket.readyState]
        },
        timestamp: new Date().toISOString()
      });
      logWebSocketState(socket, 'onclose');
      wsConnected = false;
      handleConnectionLost();
    };

    // ゲーム終了時の処理
    const handleGameEnd = async (data: any) => {
      console.log('Handling game end:', {
        data: data,
        state: data.state,
        timestamp: new Date().toISOString()
      });
    
      const finalScore = {
        player1: data.state?.score?.[username] || 0,
        player2: data.state?.score?.[Object.keys(data.state.score).find(key => key !== username) || ''] || 0,
        gameType: round === 1 ? 'tournament_final' : 'tournament_semi',
        tournamentId: sessionId,
        matchId: matchId,
      };
    
      console.log('Final score calculated:', {
        finalScore,
        timestamp: new Date().toISOString()
      });
    
      localStorage.setItem('finalScore', JSON.stringify(finalScore));
      localStorage.setItem('gameMode', 'tournament');

      // ゲーム終了後の遷移処理
      setTimeout(() => {
        if (data.next_stage === 'final_waiting') {
          window.location.href = `/tournament/waiting_final?session=${sessionId}`;
        } else if (data.next_stage === 'tournament_complete') {
          window.location.href = `/tournament/result?session=${sessionId}`;
        } else {
          window.location.href = '/tournament';
        }
      }, 1000);
    };

    // 切断時の処理
    const handleDisconnection = async (data: any) => {
      const finalScore = {
        player1: data.state?.score?.[username] ?? 15,
        player2: 0,
        gameType: round === 1 ? 'tournament_final' : 'tournament_semi',
        tournamentId: sessionId,
        matchId: matchId,
        disconnected: true,
        disconnectedPlayer: data.disconnected_player,
      };

      localStorage.setItem('finalScore', JSON.stringify(finalScore));
      localStorage.setItem('gameMode', 'tournament');

      // setTimeout(() => {
      //   window.location.href = `/tournament/result?session=${sessionId}`;
      // }, 1000);
    };

    // 自分の接続が切れた場合の処理
    const handleConnectionLost = () => {
      const finalScore = {
        player1: 0,
        player2: 15,
        gameType: round === 1 ? 'tournament_final' : 'tournament_semi',
        tournamentId: sessionId,
        matchId: matchId,
        disconnected: true,
        disconnectedPlayer: username,
      };

      localStorage.setItem('finalScore', JSON.stringify(finalScore));
      localStorage.setItem('gameMode', 'tournament');

      // window.location.href = `/tournament/result?session=${sessionId}`;
    };

    // キー入力の状態管理
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
          const moveMessage = {
            type: 'move',
            username: username,
            position: newPosition,
          };
          socket.send(JSON.stringify(moveMessage));
        }
      }
    };

    // キーイベントリスナーの設定
    const keydown = (e: KeyboardEvent) => handleKeyChange(e, true);
    const keyup = (e: KeyboardEvent) => handleKeyChange(e, false);

    document.addEventListener('keydown', keydown);
    document.addEventListener('keyup', keyup);

    function updateScoreBoard(score: IGameState['score']) {
      const scoreBoard = document.getElementById('score-board');
      if (!scoreBoard || !username) return;

      const playerScore = score[username] || 0;
      // 型アノテーションを追加して分割代入の型を明示
      const opponentEntry = Object.entries(score).find(([id]: [string, number]) => id !== username);
      const opponentScore = opponentEntry?.[1] || 0;

      const roundText = round === 1 ? 'Final' : 'Semi-final';
      scoreBoard.textContent = `${roundText}: ${isPlayer1 ? `${playerScore} - ${opponentScore}` : `${opponentScore} - ${playerScore}`}`;
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

export default TournamentGamePage;