// frontend/src/pages/Tournament/Waiting/index.ts
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { tournamentRepository } from '@/models/Tournament/repository';
import { ITournamentState } from '@/models/interface';
import './style.css';

const WaitingPage = new Page({
  name: 'Tournament/Waiting',
  config: {
    layout: CommonLayout,
    html: '/src/pages/Tournament/Waiting/index.html',
  },
  mounted: async () => {
    console.log('Tournament waiting page mounting...');
    
    // DOM要素の取得
    const statusElement = document.getElementById('connection-status');
    const participantsElement = document.getElementById('participants-count');
    const cancelButton = document.getElementById('cancel-button');

    // WebSocketメッセージハンドラ
    const handleWebSocketMessage = (data: any) => {
      console.log('Received tournament data:', data);
      
      switch (data.type) {
        case 'tournament_status':
          if (statusElement) {
            statusElement.textContent = `Waiting for players... (${data.participants.length}/4)`;
          }
          if (participantsElement) {
            participantsElement.textContent = data.participants.map((p: any) => p.displayName).join(', ');
          }
          break;

        case 'tournament_ready':
          // 4人集まったら準備画面へ遷移
          window.location.href = `/tournament/ready?session=${data.sessionId}`;
          break;

        case 'error':
          if (statusElement) {
            statusElement.textContent = `Error: ${data.message}`;
          }
          break;
      }
    };

    try {
      // WebSocket接続を確立
      await tournamentRepository.connect(handleWebSocketMessage);
      // トーナメントに参加
      tournamentRepository.joinTournament();
    } catch (error) {
      console.error('Failed to connect to tournament:', error);
      if (statusElement) {
        statusElement.textContent = 'Connection failed. Please try again.';
      }
    }

    // キャンセルボタンのイベントリスナー
    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        tournamentRepository.leaveTournament();
        tournamentRepository.disconnect();
        window.location.href = '/tournament';
      });
    }

    // クリーンアップ
    return () => {
      tournamentRepository.disconnect();
    };
  },
});

export default WaitingPage;