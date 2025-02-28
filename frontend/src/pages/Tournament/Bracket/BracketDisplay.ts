// frontend/src/pages/Tournament/Bracket/BracketDisplay.ts
import { ITournamentBracket, ITournamentMatch, ITournamentMatchStatus } from '@/models/interface';

export class BracketDisplay {
  private container: HTMLElement;
  private data: ITournamentBracket;

  constructor(containerId: string) {
    const element = document.getElementById(containerId);
    if (!element) throw new Error('Container element not found');
    this.container = element;
    this.data = { matches: [] };
  }

  public update(bracketData: ITournamentBracket) {
    this.data = bracketData;
    this.render();
  }

  private render() {
    this.container.innerHTML = `
      <div class="tournament-bracket">
        <h2 class="tournament-title">Tournament Bracket</h2>
        ${this.createSemiFinals()}
        ${this.createFinal()}
      </div>
    `;
  }

  private createSemiFinals() {
    const semiFinals = this.data.matches.filter((match) => match.round === 0);
    return `
      <div class="semi-finals">
        ${semiFinals.map((match) => this.createMatchElement(match)).join('')}
      </div>
    `;
  }

  private createFinal() {
    const final = this.data.matches.find((match) => match.round === 1);
    return final
      ? `
      <div class="final">
        ${this.createMatchElement(final)}
      </div>
    `
      : '';
  }

  private createMatchElement(match: ITournamentMatch) {
    const status = this.getStatusClass(match.status);
    return `
      <div class="match ${status}" data-match-id="${match.id}">
        <div class="player ${match.winner === match.player1 ? 'winner' : ''}">${match.player1 || '待機中'}</div>
        <div class="vs">VS</div>
        <div class="player ${match.winner === match.player2 ? 'winner' : ''}">${match.player2 || '待機中'}</div>
      </div>
    `;
  }

  private getStatusClass(status: ITournamentMatchStatus): string {
    switch (status) {
      case 'in_progress':
        return 'match-in-progress';
      case 'completed':
        return 'match-completed';
      default:
        return 'match-pending';
    }
  }
}
