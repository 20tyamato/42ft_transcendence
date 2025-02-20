// frontend/src/pages/Tournament/List/index.ts
import { Page } from '@/core/Page';
import { API_URL } from '@/config/config';
import CommonLayout from '@/layouts/common/index';
import { Tournament } from '@/types/tournament';

const TournamentListPage = new Page({
  name: 'Tournament/List',
  config: {
    layout: CommonLayout,
  },
  mounted: async ({ pg }) => {
    // 新規トーナメント作成ボタンのイベントリスナー
    const createButton = document.getElementById('create-tournament');
    if (createButton instanceof HTMLElement) {
      createButton.addEventListener('click', async () => {
        try {
          // FIXME: トーナメントID検証用debug出力1
          const requestData = {
            name: `Tournament ${new Date().toLocaleString()}`,
          };
          console.log('Creating tournament with data:', requestData);

          const response = await fetch(`${API_URL}/api/tournaments/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Token ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({
              name: `Tournament ${new Date().toLocaleString()}`,
            }),
          });

          console.log('Response status:', response.status);
          const tournament = await response.json();
          console.log('tournament data:', tournament);

          if (!response.ok) {
            throw new Error(`Failed to create tournament: ${response.status}`);
          }
          if (!tournament.id) {
            console.log('Tournament creation successful but no ID received:', tournament);
            throw new Error('Tournament ID not received');
          }

          // レスポンスからトーナメントIDを取得
          console.log('Created tournament:', tournament); // デバッグ用

          if (!tournament.id) {
            throw new Error('Tournament ID not received');
          }

          // 待機室へ遷移
          window.location.href = `/tournament/waiting?id=${tournament.id}`;
        } catch (error) {
          console.error('Tournament creation catch error:', error);
          showError(`Failed to create tournament: ${error.message}`);
        }
      });
    }

    const refreshInterval = setInterval(fetchTournaments, 5000);

    // 初期表示時にトーナメント一覧を取得
    fetchTournaments();

    // クリーンアップ
    return () => {
      clearInterval(refreshInterval);
    };

    async function fetchTournaments() {
      try {
        const response = await fetch(`${API_URL}/api/tournaments/`, {
          headers: {
            Authorization: `Token ${localStorage.getItem('token')}`, // 認証トークンを追加
          },
        });
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

      listElement.innerHTML = tournaments
        .map(
          (tournament) => `
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
      `
        )
        .join('');

      // カードのクリックイベントを設定
      setupEventListeners(listElement);
    }

    function setupEventListeners(listElement: Element) {
      // トーナメントカードのクリックイベント
      listElement.querySelectorAll('.tournament-card').forEach((card) => {
        card.addEventListener('click', (e) => {
          if (e.target instanceof HTMLButtonElement) return;
          const id = card.getAttribute('data-id');
          if (id) viewTournament(id);
        });
      });

      // 参加ボタンのクリックイベント
      listElement.querySelectorAll('.join-tournament').forEach((button) => {
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
        case 'WAITING_PLAYERS':
          return 'Waiting for Players';
        case 'IN_PROGRESS':
          return 'In Progress';
        case 'COMPLETED':
          return 'Completed';
        default:
          return status;
      }
    }

    function formatDate(dateString: string): string {
      return new Date(dateString).toLocaleString();
    }

    function viewTournament(id: string) {
      window.location.href = `/tournament/waiting?id=${id}`;
    }

    async function joinTournament(id: string) {
      try {
        const response = await fetch(`${API_URL}/api/tournaments/${id}/join/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Token ${localStorage.getItem('token')}`, // 認証トークンを追加
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
  },
});

export default TournamentListPage;
