import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { WebSocketManager } from '../Game/WebSocketManager';

const WaitingPage = new Page({
    name: 'Waiting',
    config: {
        layout: CommonLayout,
    },
    mounted: async () => {
        const statusElement = document.getElementById('waiting-status');
        const cancelButton = document.getElementById('cancel-matching');
        
        // ユーザー認証チェック
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username');
        if (!token || !username) {
            window.location.href = '/login';
            return;
        }

        // WebSocketManager インスタンスを作成
        const wsManager = new WebSocketManager('matchmaking');

        // 接続エラー時のハンドラーを登録
        wsManager.addMessageHandler('error', (data) => {
            if (statusElement) {
                statusElement.textContent = `Error: ${data.message}`;
                statusElement.style.color = 'red';
            }
        });

        // マッチング成功時のハンドラーを登録
        wsManager.addMessageHandler('match_found', (data) => {
            if (statusElement) {
                statusElement.textContent = `Match found! Opponent: ${data.opponent}`;
                statusElement.style.color = 'green';

                // 少し待ってからゲーム画面に遷移
                setTimeout(() => {
                    window.location.href = `/multiplay/game?id=${data.gameId}`;
                }, 1500);
            }
        });

        // キャンセルボタンのイベントハンドラー
        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                wsManager.sendMessage('cancel_matching', {});
                window.location.href = '/modes';
            });
        }

        // WebSocket接続を確立
        wsManager.connect();

        // クリーンアップ関数
        return () => {
            wsManager.disconnect();
        };
    },
});

export default WaitingPage;