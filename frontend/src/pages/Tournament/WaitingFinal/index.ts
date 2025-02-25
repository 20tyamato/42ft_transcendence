// frontend/src/pages/Tournament/WaitingFinal/index.ts
import { WS_URL } from '@/config/config';
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';

const TournamentWaitingFinalPage = new Page({
  name: 'Tournament/WaitingFinal',
  config: {
    layout: CommonLayout,
    html: '/src/pages/Tournament/WaitingFinal/index.html',
  },
  mounted: async () => {
    console.log('Tournament waiting final page mounting...');

    // URLパラメータから情報を取得
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session');
    const username = localStorage.getItem('username');

    if (!sessionId || !username) {
      console.error('Missing required parameters');
      window.location.href = '/tournament';
      return;
    }

    // DOM要素の取得
    const statusElement = document.getElementById('finalist-status');
    const finalistListElement = document.getElementById('finalist-list');
    const returnButton = document.getElementById('return-button');

    // WebSocket接続
    const socket = new WebSocket(`${WS_URL}/ws/tournament/waiting-final/${sessionId}/`);
    
    socket.onopen = () => {
      console.log('Tournament waiting final WebSocket connected');
      
      // 接続後にステータスチェックを要求
      socket.send(JSON.stringify({
        type: 'check_status'
      }));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Tournament waiting final received:', data);

        if (data.type === 'finalists_status') {
          updateFinalistStatus(data.finalists, data.ready);
        } else if (data.type === 'final_ready') {
          // 決勝戦の準備ができたら遷移
          const isPlayer1 = data.finalists[0].user__username === username;
          window.location.href = `/tournament/game?session=${sessionId}&isPlayer1=${isPlayer1}&matchId=${data.match_id}&round=1`;
        }
      } catch (e) {
        console.error('Error parsing WebSocket message:', e);
      }
    };

    socket.onerror = (error) => {
      console.error('Tournament waiting final WebSocket error:', error);
      if (statusElement) {
        statusElement.textContent = '接続エラーが発生しました。';
        statusElement.classList.add('error');
      }
    };

    socket.onclose = () => {
      console.log('Tournament waiting final WebSocket closed');
    };

    // 戻るボタンの処理
    if (returnButton) {
      returnButton.addEventListener('click', () => {
        socket.close();
        window.location.href = '/tournament';
      });
    }

    // ファイナリストのステータス更新
    function updateFinalistStatus(finalists, ready) {
      if (statusElement) {
        if (ready) {
          statusElement.textContent = '決勝戦の準備が整いました。間もなく開始します。';
          statusElement.classList.add('ready');
        } else {
          statusElement.textContent = `決勝進出者: ${finalists.length}/2 - もう一方の準決勝が終了するのを待っています...`;
        }
      }

      if (finalistListElement) {
        finalistListElement.innerHTML = '';
        finalists.forEach(finalist => {
          const el = document.createElement('div');
          el.classList.add('finalist');
          el.textContent = finalist.user__display_name || finalist.user__username;
          finalistListElement.appendChild(el);
        });
      }
    }

    // クリーンアップ関数
    return () => {
      socket.close();
    };
  },
});

export default TournamentWaitingFinalPage;