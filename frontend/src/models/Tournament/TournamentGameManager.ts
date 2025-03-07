// frontend/src/models/Tournament/TournamentGameManager.ts
import { BaseGameManager } from '@/models/Services/BaseGameManager';
import { GameRenderer } from '@/models/Services/game_renderer';
import { IGameConfig, IGameState, ITournamentMatch } from '@/models/interface';

export class TournamentGameManager extends BaseGameManager {
  private renderer: GameRenderer;
  private scoreBoard: HTMLElement | null;
  private roundDisplay: HTMLElement | null;
  private matchId: string;
  private round: number; // 0: 準決勝, 1: 決勝
  private tournamentId: string;
  
  constructor(config: IGameConfig, container: HTMLElement, matchId: string, round: number) {
    super(config);
    this.renderer = new GameRenderer(container, config.isPlayer1);
    this.scoreBoard = document.getElementById('score-board');
    this.roundDisplay = document.getElementById('round-display');
    this.matchId = matchId;
    this.round = round;
    this.tournamentId = this.extractTournamentId(this.config.sessionId);
    
    // ラウンド表示の更新
    this.updateRoundDisplay();
  }

  private extractTournamentId(sessionId: string): string {
    const parts = sessionId.split('_');
    return parts[parts.length - 1]; // 最後の部分をトーナメントIDとして扱う
  }
  
  private updateRoundDisplay(): void {
    if (this.roundDisplay) {
      this.roundDisplay.textContent = this.round === 0 ? 'Semi-Final' : 'Final';
    }
  }

  protected onInitialized(): Promise<void> {
    console.log('Tournament game initialized:', {
      sessionId: this.config.sessionId,
      username: this.config.username,
      matchId: this.matchId,
      round: this.round,
    });
    
    return Promise.resolve();
  }

  protected onStateUpdate(state: IGameState): void {
    // レンダラーにゲーム状態を更新
    this.renderer.updateState(state);

    // スコアボードの更新
    this.updateScoreBoard(state.score);

    // 現在の位置を更新
    const position = this.renderer.getPaddlePosition(this.config.username);
    if (position !== null) {
      this.currentPosition = position;
      this.inputHandler.setPosition(position);
    }
  }

  protected onPlayerDisconnected(player: string, state: IGameState): void {
    console.log('Player disconnected:', player);

    // 切断情報を含めた最終スコアを保存
    const [player1Name, player2Name] = this.getPlayerNames();
    const opponent = this.config.username === player1Name ? player2Name : player1Name;

    const finalScore = {
      player1: state?.score?.[this.config.username] ?? 15, // 切断の場合は残ったプレイヤーが勝利
      player2: state?.score?.[opponent] ?? 0,
      opponent: opponent,
      disconnected: true,
      disconnectedPlayer: player,
      sessionId: this.tournamentId, // トーナメントIDを含める
    };

    localStorage.setItem('finalScore', JSON.stringify(finalScore));
    localStorage.setItem('gameMode', 'tournament');

    // 結果画面に遷移
    setTimeout(() => {
      this.handleTournamentNavigation(player !== this.config.username);
    }, 1000);
  }

  protected onConnectionError(): void {
    console.error('Connection error occurred');

    // 通信エラー時のスコア保存
    const [player1Name, player2Name] = this.getPlayerNames();
    const opponent = this.config.username === player1Name ? player2Name : player1Name;

    const finalScore = {
      player1: 0, // 自分が切断した場合は敗北
      player2: 15, // 相手が勝利
      opponent: opponent,
      disconnected: true,
      disconnectedPlayer: this.config.username,
      sessionId: this.tournamentId,
    };

    localStorage.setItem('finalScore', JSON.stringify(finalScore));
    localStorage.setItem('gameMode', 'tournament');

    // 結果画面に遷移
    window.location.href = '/result';
  }

  protected onError(message: string): void {
    console.error('Tournament game error:', message);
    // エラーメッセージ表示などの処理を追加可能
  }

  protected onGameEnd(data: any): void {
    console.log('Tournament game ended:', data);

    const [player1Name, player2Name] = this.getPlayerNames();
    const opponent = this.config.username === player1Name ? player2Name : player1Name;
    const isWinner = data.state.score[this.config.username] > data.state.score[opponent];

    const finalScore = {
      player1: data.state.score[this.config.username] || 0,
      player2: data.state.score[opponent] || 0,
      opponent: opponent,
      sessionId: this.tournamentId,
    };

    localStorage.setItem('finalScore', JSON.stringify(finalScore));
    localStorage.setItem('gameMode', 'tournament');

    setTimeout(() => {
      this.handleTournamentNavigation(isWinner);
    }, 1000);
  }

  protected onCleanup(): void {
    this.renderer.dispose();
    console.log('Tournament game cleanup complete');
  }

  private updateScoreBoard(score: Record<string, number>): void {
    if (!this.scoreBoard) return;

    const [player1Name, player2Name] = this.getPlayerNames();
    const playerScore = score[this.config.username] || 0;
    const opponentScore = score[this.config.username === player1Name ? player2Name : player1Name] || 0;

    this.scoreBoard.textContent = this.config.isPlayer1
      ? `${playerScore} - ${opponentScore}`
      : `${opponentScore} - ${playerScore}`;
  }

  private getPlayerNames(): [string, string] {
    // セッションIDからプレイヤー名を抽出（形式: "tournament_player1_player2_tournamentId"）
    const parts = this.config.sessionId.split('_');
    if (parts.length >= 4) {
      return [parts[1], parts[2]];
    }
    // フォールバック: ユーザー名と "opponent"
    return [this.config.username, 'opponent'];
  }

  private handleTournamentNavigation(isWinner: boolean): void {
    if (this.round === 0) {
      // 準決勝後の遷移
      if (isWinner) {
        // 勝者は決勝待機画面へ
        window.location.href = `/tournament/waiting_next_match?session=${this.tournamentId}`;
      } else {
        // 敗者は結果画面へ
        window.location.href = '/result';
      }
    } else {
      // 決勝後の遷移
      window.location.href = '/result';
    }
  }
}