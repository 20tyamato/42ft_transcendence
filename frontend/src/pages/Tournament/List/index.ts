// frontend/src/pages/Tournament/List/index.ts
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';

interface Tournament {
  id: number;
  name: string;
  status: 'WAITING_PLAYERS' | 'IN_PROGRESS' | 'COMPLETED';
  created_at: string;
  participants: number;
}

const TournamentListPage = new Page({
  name: 'Tournament/List',
  config: {
    layout: CommonLayout,
  },
  mounted: async ({ pg }) => {
    const refreshInterval = setInterval(fetchTournaments, 5000);

    // 初期表示時にトーナメント一覧を取得
    fetchTournaments();

    // クリーンアップ
    return () => {
      clearInterval(refreshInterval);
    };

    async function fetchTournaments() {
      try {
        const response = await fetch('/api/tournaments');
        if (!response.ok) throw new Error('Failed to fetch tournaments');
        const tournaments = await response.json();
        displayTournaments(tournaments);
      } catch (error) {
        showError('Failed to load tournaments');
      }
    }

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
      setupEventListeners(listElement);
    }

    function setupEventListeners(listElement: Element) {
      // トーナメントカードのクリックイベント
      listElement.querySelectorAll('.tournament-card').forEach(card => {
        card.addEventListener('click', (e) => {
          if (e.target instanceof HTMLButtonElement) return;
          const id = card.getAttribute('data-id');
          if (id) viewTournament(id);
        });
      });

      // 参加ボタンのクリックイベント
      listElement.querySelectorAll('.join-tournament').forEach(button => {
        button.addEventListener('click', async (e) => {
          e.stopPropagation();
          const id = button.getAttribute('data-id');
          if (id) await joinTournament(id);
        });
      });
    }

    function renderActionButton(tournament: Tournament) {
      if (tournament.status === 'WAITING_PLAYERS' && tournament.participants < 4) {
        return `<button class="btn-primary join-tournament" data-id="${tournament.id}">Join</button>`;
      }
      return '';
    }

    function formatStatus(status: string): string {
      switch (status) {
        case 'WAITING_PLAYERS': return 'Waiting for Players';
        case 'IN_PROGRESS': return 'In Progress';
        case 'COMPLETED': return 'Completed';
        default: return status;
      }
    }

    function formatDate(dateString: string): string {
      return new Date(dateString).toLocaleString();
    }

    function viewTournament(id: string) {
      window.location.href = `/tournament/${id}`;
    }

    async function joinTournament(id: string) {
      try {
        const response = await fetch(`/api/tournaments/${id}/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) throw new Error('Failed to join tournament');
        
        // 参加成功後、待機ページへ遷移
        window.location.href = `/tournament/waiting?id=${id}`;
      } catch (error) {
        showError('Failed to join tournament');
      }
    }

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
          const response = await fetch('/api/tournaments', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: `Tournament ${new Date().toLocaleString()}`
            }),
          });

          if (!response.ok) throw new Error('Failed to create tournament');
          
          // 作成後、一覧を再取得
          fetchTournaments();
        } catch (error) {
          showError('Failed to create tournament');
        }
      });
    }
  },
});

export default TournamentListPage;