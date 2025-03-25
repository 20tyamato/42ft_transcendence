import { logger } from '@/core/Logger';
import { IGameConfig, IGameState } from '../Game/type';
import { BaseGameManager } from '../Services/BaseGameManager';
import { GameRenderer } from '../Services/game_renderer';

export class MultiplayerGameManager extends BaseGameManager {
  private renderer: GameRenderer;
  private scoreBoard: HTMLElement | null;

  constructor(config: IGameConfig, container: HTMLElement) {
    super(config);
    this.renderer = new GameRenderer(container, config.isPlayer1);
    this.scoreBoard = document.getElementById('score-board');
  }

  protected onInitialized(): Promise<void> {
    logger.log('Multiplayer game initialized:', {
      sessionId: this.config.sessionId,
      username: this.config.username,
    });
    // 初期化時の追加処理があればここに実装
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
    logger.log('Player disconnected:', player);

    // 切断情報を含めた最終スコアを保存
    const [player1Name, player2Name] = this.config.sessionId?.split('_').slice(1, 3) || [];
    const opponent = this.config.username === player1Name ? player2Name : player1Name;

    const finalScore = {
      player1: state?.score?.[this.config.username] ?? 15, // 切断の場合は残ったプレイヤーが勝利
      player2: state?.score?.[opponent] ?? 0,
      opponent: opponent,
      disconnected: true,
      disconnectedPlayer: player,
    };

    localStorage.setItem('finalScore', JSON.stringify(finalScore));
    localStorage.setItem('gameMode', 'multiplayer');

    // 結果画面に遷移
    setTimeout(() => {
      window.location.href = '/result';
    }, 1000);
  }

  protected onConnectionError(): void {
    logger.error('Connection error occurred');

    // 通信エラー時のスコア保存
    const [player1Name, player2Name] = this.config.sessionId?.split('_').slice(1, 3) || [];
    const opponent = this.config.username === player1Name ? player2Name : player1Name;

    const finalScore = {
      player1: 0, // 自分が切断した場合は敗北
      player2: 15, // 相手が勝利
      opponent: opponent,
      disconnected: true,
      disconnectedPlayer: this.config.username,
    };

    localStorage.setItem('finalScore', JSON.stringify(finalScore));
    localStorage.setItem('gameMode', 'multiplayer');

    // 結果画面に遷移
    window.location.href = '/result';
  }

  protected onError(message: string): void {
    logger.error('Game error:', message);
    // エラーメッセージ表示などの処理を追加可能
  }

  protected onGameEnd(data: any): void {
    logger.log('Game ended:', data);

    const [player1Name, player2Name] = this.config.sessionId?.split('_').slice(1, 3) || [];
    const opponent = this.config.username === player1Name ? player2Name : player1Name;

    const finalScore = {
      player1: data.state.score[this.config.username] || 0,
      player2: data.state.score[opponent] || 0,
      opponent: opponent,
    };

    localStorage.setItem('finalScore', JSON.stringify(finalScore));
    localStorage.setItem('gameMode', 'multiplayer');

    setTimeout(() => {
      window.location.href = '/result';
    }, 1000);
  }

  protected onCleanup(): void {
    this.renderer.dispose();
    logger.log('Multiplayer game cleanup complete');
  }

  private updateScoreBoard(score: Record<string, number>): void {
    if (!this.scoreBoard) return;
    const playerScore = score[this.config.username] || 0;
    const entries = Object.keys(score).map((key) => [key, score[key]]);
    const opponentEntry = entries.find(([id]) => id !== this.config.username);
    const opponentScore = opponentEntry?.[1] || 0;

    this.scoreBoard.textContent = this.config.isPlayer1
      ? `${playerScore} - ${opponentScore}`
      : `${opponentScore} - ${playerScore}`;
  }
}
