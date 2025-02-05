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
        console.log("Game Page Mounting...");

        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session');
        const playername = localStorage.getItem('username');

        console.log("Params check:", { sessionId, playername });

        if (!sessionId || !playername) {
            console.log("Missing required params, will redirect in 2 seconds...");  // 追加
            await new Promise(resolve => setTimeout(resolve, 2000));  // 2秒待機
            console.log("Redirecting to /multiplay");  // 追加
            window.location.href = '/multiplay';
            return;
        }

        const container = document.getElementById('game-canvas');
        if (!container) return;

        const renderer = new GameRenderer(container);
        const socket = new WebSocket(`${WS_URL}/ws/game/${sessionId}/${playername}/`);

        socket.onopen = () => {
            console.log('Game WebSocket connected');
        };
    
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'state_update') {
                renderer.updateState(data.state);
                renderer.render();
                updateScoreBoard(data.state.score);
            }
        };

        // キー入力の処理
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                const movement = e.key === 'ArrowLeft' ? -10 : 10;
                socket.send(JSON.stringify({
                    type: 'move',
                    player_id: playername,
                    position: movement
                }));
            }
        });

        function updateScoreBoard(score: any) {
            const scoreBoard = document.getElementById('score-board');
            if (scoreBoard) {
                scoreBoard.textContent = `${score[playername]} - ${
                    Object.entries(score).find(([id]) => id !== playername)?.[1] || 0
                }`;
            }
        }

        // クリーンアップ
        return () => {
            socket?.close();
        };
    }
});

export default GamePage;