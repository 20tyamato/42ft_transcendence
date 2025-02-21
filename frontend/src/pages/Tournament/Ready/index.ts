// frontend/src/pages/Tournament/Ready/index.ts
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { BracketDisplay } from '../Bracket/BracketDisplay';
import { tournamentRepository } from '@/models/Tournament/repository';
import { ITournamentState, ITournamentBracket } from '@/models/interface';
import './style.css';

class TournamentReadyPage extends Page {
  private bracketDisplay: BracketDisplay | null = null;
  private readyButton: HTMLButtonElement | null = null;
  private countdownDisplay: HTMLElement | null = null;
  private playerStatusList: HTMLElement | null = null;
  private sessionId: string | null = null;

  constructor() {
    super({
      name: 'Tournament/Ready',
      config: {
        layout: CommonLayout,
        html: '/src/pages/Tournament/Ready/index.html',
      },
    });
  }

  private initElements() {
    this.readyButton = document.getElementById('ready-button') as HTMLButtonElement;
    this.countdownDisplay = document.getElementById('countdown');
    this.playerStatusList = document.getElementById('player-status-list');
    this.bracketDisplay = new BracketDisplay('bracket-container');

    if (!this.readyButton || !this.countdownDisplay || !this.playerStatusList) {
      throw new Error('Required elements not found');
    }
  }

  private handleWebSocketMessage(data: any) {
    console.log('Received tournament data:', data);

    switch (data.type) {
      case 'tournament_state':
        this.updateTournamentState(data.state);
        break;
      case 'countdown':
        this.updateCountdown(data.countdown);
        break;
      case 'tournament_start':
        this.handleTournamentStart(data);
        break;
      case 'error':
        console.error('Tournament error:', data.message);
        break;
    }
  }

  private updateTournamentState(state: ITournamentState) {
    if (this.playerStatusList) {
      this.playerStatusList.innerHTML = state.participants
        .map(
          (player) => `
                    <div class="player-item ${player.isReady ? 'player-ready' : ''}">
                        <span>${player.displayName}</span>
                        <span>${player.isReady ? '✓ Ready' : 'Waiting...'}</span>
                    </div>
                `
        )
        .join('');
    }

    // ブラケット表示の更新
    if (this.bracketDisplay) {
      const bracketData: ITournamentBracket = {
        matches: [
          {
            id: 'semi1',
            round: 0,
            player1: state.participants[0]?.username || null,
            player2: state.participants[1]?.username || null,
            winner: null,
            status: 'pending',
          },
          {
            id: 'semi2',
            round: 0,
            player1: state.participants[2]?.username || null,
            player2: state.participants[3]?.username || null,
            winner: null,
            status: 'pending',
          },
          {
            id: 'final',
            round: 1,
            player1: null,
            player2: null,
            winner: null,
            status: 'pending',
          },
        ],
      };
      this.bracketDisplay.update(bracketData);
    }
  }

  private updateCountdown(countdown: number) {
    if (this.countdownDisplay) {
      const minutes = Math.floor(countdown / 60);
      const seconds = countdown % 60;
      this.countdownDisplay.textContent = `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }
  }

  private handleTournamentStart(data: any) {
    // トーナメント開始時の処理
    window.location.href = `/tournament/game?session=${this.sessionId}`;
  }

  private async setupWebSocket() {
    try {
      await tournamentRepository.connect(this.handleWebSocketMessage.bind(this));
    } catch (error) {
      console.error('Failed to connect to tournament:', error);
    }
  }

  mounted() {
    try {
      this.initElements();

      // URLからセッションIDを取得
      const params = new URLSearchParams(window.location.search);
      this.sessionId = params.get('session');

      if (!this.sessionId) {
        throw new Error('No session ID provided');
      }

      // WebSocket接続のセットアップ
      this.setupWebSocket();

      // Readyボタンのイベントハンドラ
      if (this.readyButton) {
        this.readyButton.addEventListener('click', () => {
          if (this.readyButton) {
            this.readyButton.classList.toggle('active');
            const isReady = this.readyButton.classList.contains('active');
            tournamentRepository.sendReady(isReady);
          }
        });
      }
    } catch (error) {
      console.error('Error in mounting tournament ready page:', error);
      window.location.href = '/tournament';
    }
  }

  unmounted() {
    tournamentRepository.disconnect();
  }
}

export default new TournamentReadyPage();
