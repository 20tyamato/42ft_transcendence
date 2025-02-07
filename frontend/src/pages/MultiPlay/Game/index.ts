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
        // パラメータの取得と検証
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session');
        const isPlayer1 = urlParams.get('isPlayer1') === 'true';
        const username = localStorage.getItem('username');

        console.log("Game parameters:", { sessionId, isPlayer1, username });

        if (!sessionId || !username) {
            console.log("Missing required params:", { sessionId, username });
            await new Promise(resolve => setTimeout(resolve, 2000));
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
        let keyState = {
            ArrowLeft: false,
            ArrowRight: false
        };

        // WebSocket接続
        const socket = new WebSocket(`${WS_URL}/ws/game/${sessionId}/${username}/`);
        let wsConnected = false;

        socket.onopen = () => {
            console.log('Game WebSocket connected');
            wsConnected = true;
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'state_update') {
                    renderer.updateState(data.state);
                    updateScoreBoard(data.state.score);
                }
            } catch (e) {
                console.error('Error processing game message:', e);
            }
        };

        socket.onerror = (error) => {
            console.error('Game WebSocket error:', error);
            wsConnected = false;
        };

        socket.onclose = () => {
            console.log('Game WebSocket closed');
            wsConnected = false;
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
                        position: newPosition
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
                const opponentScore = Object.entries(score)
                    .find(([id]) => id !== username)?.[1] || 0;
                scoreBoard.textContent = isPlayer1 ? 
                    `${playerScore} - ${opponentScore}` : 
                    `${opponentScore} - ${playerScore}`;
            }
        }

        // クリーンアップ関数を返す
        return () => {
            document.removeEventListener('keydown', keydown);
            document.removeEventListener('keyup', keyup);
            socket?.close();
            renderer.dispose();
        };
    }
});

export default GamePage;