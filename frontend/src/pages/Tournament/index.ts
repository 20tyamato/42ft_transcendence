// frontend/src/pages/Tournament/index.ts

import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { API_URL } from '@/config/config';
import { WebSocketManager, WebSocketMessage } from '@/core/WebSocketManager';

interface Tournament {
  id: number;
  name: string;
  status: 'WAITING_PLAYERS' | 'IN_PROGRESS' | 'COMPLETED';
  created_at: string;
  participants: number;
}

const TournamentPage = new Page({
  name: 'Tournament',
  config: {
    layout: CommonLayout,
  },
  mounted: async ({ pg }) => {
    // トーナメント一覧の取得と表示
    async function fetchTournaments() {
      try {
        const response = await fetch(`${API_URL}/api/tournaments`, {
          headers: {
            'Authorization': `Token ${localStorage.getItem('token')}`, // 認証トークンを追加
          }
        });
        if (!response.ok) throw new Error('Failed to fetch tournaments');
        const tournaments = await response.json();
        displayTournaments(tournaments);
      } catch (error) {
        showError('Failed to load tournaments');
      }
    }

    // トーナメント一覧の表示
    function displayTournaments(tournaments: Tournament[]) {
      const listElement = document.querySelector('.tournament-list');
      if (!listElement) return;

      listElement.innerHTML = tournaments.map(tournament => `
        <div class="tournament-card" data-id="${tournament.id}">
          <h3>${tournament.name}</h3>
          <span class="tournament-card-status status-${tournament.status.toLowerCase()}">
            ${formatStatus(tournament.status)}
          </span>
          <div class="tournament-card-info">
            <div>Created: ${formatDate(tournament.created_at)}</div>
            <div>Participants: ${tournament.participants}/4</div>
          </div>
          <div class="tournament-card-actions">
            ${renderActionButton(tournament)}
          </div>
        </div>
      `).join('');

      // カードのクリックイベントを設定
      listElement.querySelectorAll('.tournament-card').forEach(card => {
        card.addEventListener('click', (e) => {
          if (e.target instanceof HTMLButtonElement) return; // ボタンクリックは除外
          const id = card.getAttribute('data-id');
          if (id) viewTournament(id);
        });
      });
    }

    // トーナメントの状態に応じたボタンの表示
    function renderActionButton(tournament: Tournament) {
      if (tournament.status === 'WAITING_PLAYERS' && tournament.participants < 4) {
        return `<button class="btn-primary join-tournament" data-id="${tournament.id}">Join</button>`;
      }
      return '';
    }

    // 状態の表示形式を整形
    function formatStatus(status: string): string {
      switch (status) {
        case 'WAITING_PLAYERS': return 'Waiting for Players';
        case 'IN_PROGRESS': return 'In Progress';
        case 'COMPLETED': return 'Completed';
        default: return status;
      }
    }

    // 日付の表示形式を整形
    function formatDate(dateString: string): string {
      return new Date(dateString).toLocaleString();
    }

    // トーナメントの詳細表示へ移動
    function viewTournament(id: string) {
      window.location.href = `/tournament/waiting?id=${id}`;
    }

    // エラーメッセージの表示
    function showError(message: string) {
      const errorContainer = document.getElementById('error-container');
      if (errorContainer) {
        errorContainer.innerHTML = `
          <div class="error-message">${message}</div>
        `;
      }
    }

    // 新規トーナメント作成ボタンのイベントリスナー
    const createButton = document.getElementById('create-tournament');
    if (createButton) {
      createButton.addEventListener('click', async () => {
        try {
          const response = await fetch(`${API_URL}/api/tournaments`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Token ${localStorage.getItem('token')}`, // 認証トークンを追加
            },
            body: JSON.stringify({
              name: `Tournament ${new Date().toLocaleString()}`
            }),
          });
    
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Tournament creation error:', {
              status: response.status,
              statusText: response.statusText,
              errorBody: errorText
            });
            throw new Error(`Failed to create tournament: ${response.status} ${errorText}`);
          }
          
          // 作成後、一覧を再取得
          fetchTournaments();
        } catch (error) {
          console.error('Tournament creation catch error:', error);
          showError(`Failed to create tournament: ${error.message}`);
        }
      });
    }

    // 初期表示時にトーナメント一覧を取得
    fetchTournaments();

    // トーナメント一覧の定期更新
    const refreshInterval = setInterval(fetchTournaments, 5000);

    // クリーンアップ
    return () => {
      clearInterval(refreshInterval);
    };
  },
});

export default TournamentPage;