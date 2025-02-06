// frontend/src/pages/MultiPlay/Game/index.ts
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { WS_URL } from '@/config/config';
import { GameRenderer } from './game_renderer';
import './style.css';

const GamePage = new Page({
   name: 'MultiPlay/Game',
   config: {
       layout: CommonLayout,
   },
   mounted: async () => {
       console.log("Full URL:", window.location.href);
       console.log("Search string:", window.location.search);
       
       const urlParams = new URLSearchParams(window.location.search);
       const sessionId = urlParams.get('session');
       const isPlayer1 = urlParams.get('isPlayer1') === 'true';
       const username = localStorage.getItem('username');

       console.log("Game parameters:", {
           sessionId,
           isPlayer1,
           username
       });

       if (!sessionId || !username) {
           console.log("Missing required params:", { sessionId, username });
           await new Promise(resolve => setTimeout(resolve, 2000));
           window.location.href = '/multiplay';
           return;
       }

       const container = document.getElementById('game-canvas');
       if (!container) {
           console.error('Game container not found');
           return;
       }

       // Three.jsレンダラーの初期化
       const renderer = new GameRenderer(container, isPlayer1);
       
       // WebSocket接続
       const socket = new WebSocket(`${WS_URL}/ws/game/${sessionId}/${username}/`);

       socket.onopen = () => {
           console.log('Game WebSocket connected');
       };
   
       socket.onmessage = (event) => {
           try {
               const data = JSON.parse(event.data);
               console.log('Received game state:', data); 
               if (data.type === 'state_update') {
                   renderer.updateState(data.state);
                   renderer.render();
                   updateScoreBoard(data.state.score);
               }
           } catch (e) {
               console.error('Error processing game message:', e);
           }
       };

       socket.onerror = (error) => {
           console.error('Game WebSocket error:', error);
       };

       socket.onclose = () => {
           console.log('Game WebSocket closed');
           // 必要に応じてリザルト画面に遷移
           // window.location.href = '/result';
       };

       // キー入力の処理
       document.addEventListener('keydown', (e) => {
           if (socket.readyState !== WebSocket.OPEN) return;

           if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            const currentPosition = this.paddle ? this.paddle.position.x : 0;
            const movement = e.key === 'ArrowLeft' ? -10 : 10;
            const newPosition = currentPosition + movement;  // 現在位置から移動
            
            console.log('Sending move:', { newPosition });  // デバッグログ
            socket.send(JSON.stringify({
                type: 'move',
                username: username,
                position: newPosition  // 絶対位置を送信
            }));
        }
       });

       function updateScoreBoard(score: any) {
           const scoreBoard = document.getElementById('score-board');
           if (scoreBoard) {
               const playerScore = score[username] || 0;
               const opponentScore = Object.entries(score)
                   .find(([id]) => id !== username)?.[1] || 0;
               
               scoreBoard.textContent = isPlayer1 
                   ? `${playerScore} - ${opponentScore}`
                   : `${opponentScore} - ${playerScore}`;
           }
       }

       // クリーンアップ
       return () => {
           socket?.close();
       };
   }
});

export default GamePage;