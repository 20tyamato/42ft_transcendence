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
        console.log("All URL parameters:", Object.fromEntries(urlParams));
        
        const sessionId = urlParams.get('session');
        const username = localStorage.getItem('username');

        console.log("Extracted values:", {
            sessionId,
            username,
            rawSearch: window.location.search,
            parsedParams: urlParams
        });

        if (!sessionId || !username) {
            console.log("Check failed:", {
                hasSessionId: !!sessionId,
                hasUsername: !!username
            });
            await new Promise(resolve => setTimeout(resolve, 20000000));
            window.location.href = '/multiplay';
            return;
        }

        const container = document.getElementById('game-canvas');
        if (!container) return;

        const renderer = new GameRenderer(container);
        const socket = new WebSocket(`${WS_URL}/ws/game/${sessionId}/${username}/`);

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
                    player_id: username,
                    position: movement
                }));
            }
        });

        function updateScoreBoard(score: any) {
            const scoreBoard = document.getElementById('score-board');
            if (scoreBoard) {
                scoreBoard.textContent = `${score[username]} - ${
                    Object.entries(score).find(([id]) => id !== username)?.[1] || 0
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