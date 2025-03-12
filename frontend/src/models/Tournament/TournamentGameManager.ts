// frontend/src/models/Tournament/TournamentGameManager.ts
import { BaseGameManager } from '@/models/Services/BaseGameManager';
import { GameRenderer } from '@/models/Services/game_renderer';
import { IGameConfig, IGameState, ITournamentInfo } from '@/models/Game/type';


export class TournamentGameManager extends BaseGameManager {
  private renderer: GameRenderer;
  private scoreBoard: HTMLElement | null;
  private tournamentInfo: ITournamentInfo;

  constructor(config: IGameConfig, container: HTMLElement, tournamentInfo: ITournamentInfo) {
    super(config);
    this.renderer = new GameRenderer(container, config.isPlayer1);
    this.scoreBoard = document.getElementById('score-board');
    this.tournamentInfo = tournamentInfo;
  }

  protected onInitialized(): Promise<void> {
    console.log('Tournament game initialized:', {
        sessionId: this.config.sessionId,
        username: this.config.username,
        roundType: this.tournamentInfo.roundType,
        tournamentId: this.tournamentInfo.tournamentId
    });
    
    // ラウンド情報をUIに表示
    this.updateRoundDisplay();
    
    // セッションIDを送信して初期化を開始
    return new Promise((resolve, reject) => {
        // 初期化完了イベントを監視
        const initHandler = (data: any) => {
            if (data.type === 'game_initialized') {
                console.log('Game initialization confirmed by server');
                this.wsService.removeMessageHandler('game_initialized', initHandler);
                resolve();
            }
        };
        
        // エラーメッセージを監視
        const errorHandler = (data: any) => {
            if (data.type === 'error') {
                console.error('Game initialization error:', data.message);
                this.wsService.removeMessageHandler('error', errorHandler);
                reject(new Error(data.message));
            }
        };
        
        // ハンドラを登録
        this.wsService.addMessageHandler('game_initialized', initHandler);
        this.wsService.addMessageHandler('error', errorHandler);
        
        // セッションID初期化メッセージを送信
        console.log('Sending session_init with ID:', this.config.sessionId);
        this.wsService.send({
            type: 'session_init',
            session_id: this.config.sessionId
        });
        
        // タイムアウト設定（10秒）
        setTimeout(() => {
            this.wsService.removeMessageHandler('game_initialized', initHandler);
            this.wsService.removeMessageHandler('error', errorHandler);
            reject(new Error('Game initialization timeout'));
        }, 10000);
    }).catch(error => {
        console.error('Failed to initialize game:', error);
        return Promise.resolve(); // エラーでも続行
    });
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
    console.log('Tournament player disconnected:', player);

    // セッションIDから対戦相手の情報を抽出
    const sessionInfo = this.parseSessionId();
    const opponent = sessionInfo.player1 === this.config.username ? sessionInfo.player2 : sessionInfo.player1;

    const finalScore = {
      player1: state?.score?.[this.config.username] ?? 15, // 切断の場合は残ったプレイヤーが勝利
      player2: state?.score?.[opponent] ?? 0,
      opponent: opponent,
      disconnected: true,
      disconnectedPlayer: player,
      tournamentId: this.tournamentInfo.tournamentId,
      roundType: this.tournamentInfo.roundType
    };

    localStorage.setItem('finalScore', JSON.stringify(finalScore));
    localStorage.setItem('gameMode', 'tournament');

    // 結果画面に遷移
    // setTimeout(() => {
    //   // 準決勝の場合は決勝待機画面へ
    //   if (this.tournamentInfo.roundType.startsWith('semi')) {
    //     window.location.href = `/tournament/waiting-next-match?tournamentId=${this.tournamentInfo.tournamentId}`;
    //   } else {
    //     // 決勝の場合は結果画面へ
    //     window.location.href = '/result';
    //   }
    // }, 1000);
  }

  protected onConnectionError(): void {
    console.error('Tournament connection error occurred');

    // セッションIDから対戦相手の情報を抽出
    const sessionInfo = this.parseSessionId();
    const opponent = sessionInfo.player1 === this.config.username ? sessionInfo.player2 : sessionInfo.player1;

    const finalScore = {
      player1: 0, // 自分が切断した場合は敗北
      player2: 15, // 相手が勝利
      opponent: opponent,
      disconnected: true,
      disconnectedPlayer: this.config.username,
      tournamentId: this.tournamentInfo.tournamentId,
      roundType: this.tournamentInfo.roundType
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

    // セッションIDから対戦相手の情報を抽出
    const sessionInfo = this.parseSessionId();
    const opponent = sessionInfo.player1 === this.config.username ? sessionInfo.player2 : sessionInfo.player1;

    const finalScore = {
      player1: data.state.score[this.config.username] || 0,
      player2: data.state.score[opponent] || 0,
      opponent: opponent,
      tournamentId: this.tournamentInfo.tournamentId,
      roundType: this.tournamentInfo.roundType
    };

    localStorage.setItem('finalScore', JSON.stringify(finalScore));
    localStorage.setItem('gameMode', 'tournament');

    // 準決勝か決勝かに応じて遷移先を変える
    setTimeout(() => {
      if (this.tournamentInfo.roundType.startsWith('semi')) {
        // 準決勝の場合、決勝待機画面に遷移
        window.location.href = `/tournament/waiting-next-match?tournamentId=${this.tournamentInfo.tournamentId}`;
      } else {
        // 決勝の場合、結果画面に遷移
        window.location.href = '/result';
      }
    }, 1000);
  }

  protected onCleanup(): void {
    this.renderer.dispose();
    console.log('Tournament game cleanup complete');
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

  private updateRoundDisplay(): void {
    // ラウンド情報をUIに表示する（例: ヘッダーテキストを更新）
    const roundElement = document.querySelector('.card-header h2');
    if (roundElement) {
      const roundName = this.tournamentInfo.roundType.startsWith('semi') 
        ? 'Semi-Final' 
        : 'Final Match';
      
      roundElement.textContent = `Tournament ${roundName}`;
    }
  }

  private parseSessionId(): {
    tournamentId: string;
    roundType: string;
    player1: string;
    player2: string;
  } {
    // tournament_{tournament_id}_{round_type}_{player1}_{player2}_{timestamp}
    const parts = this.config.sessionId.split('_');
    
    if (parts.length < 6) {
      console.error('Invalid tournament session ID format:', this.config.sessionId);
      return {
        tournamentId: this.tournamentInfo.tournamentId,
        roundType: this.tournamentInfo.roundType,
        player1: '',
        player2: ''
      };
    }
    
    return {
      tournamentId: parts[1],
      roundType: parts[2],
      player1: parts[3],
      player2: parts[4]
    };
  }
}
