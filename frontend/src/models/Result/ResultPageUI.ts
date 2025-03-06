// src/models/Result/ResultPageUI.ts

import { API_URL } from '@/config/config';
import { fetchUserAvatar } from '@/models/User/repository';
import { IGameResult } from '@/models/interface';

/**
 * 結果画面のUI操作を担当するクラス
 */
export class ResultPageUI {
  private playerScoreElement: HTMLElement | null;
  private opponentScoreElement: HTMLElement | null;
  private resultMessage: HTMLElement | null;
  private playerNameElement: HTMLElement | null;
  private opponentNameElement: HTMLElement | null;
  private playerAvatarImg: HTMLImageElement | null;
  private opponentAvatarImg: HTMLImageElement | null;
  private exitBtn: HTMLElement | null;

  /**
   * コンストラクタ - DOM要素の初期化
   */
  constructor() {
    // スコア関連要素
    this.playerScoreElement = document.getElementById('playerScore');
    this.opponentScoreElement = document.getElementById('cpuScore');
    this.resultMessage = document.getElementById('result-message');

    // プレイヤー情報要素
    this.playerNameElement = document.getElementById('playerName');
    this.opponentNameElement = document.querySelector('.cpu-side .player-name');

    // アバター要素
    this.playerAvatarImg = document.getElementById('player-avatar') as HTMLImageElement;
    this.opponentAvatarImg = document.getElementById('opponent-avatar') as HTMLImageElement;

    // 操作ボタン
    this.exitBtn = document.getElementById('exitBtn');
  }

  /**
   * 終了ボタンのイベントハンドラを設定
   */
  setupEventHandlers(callback: () => void): void {
    this.exitBtn?.addEventListener('click', callback);
  }

  /**
   * プレイヤー名を表示
   */
  displayPlayerNames(username: string, opponent: string | undefined): void {
    if (this.playerNameElement && username) {
      this.playerNameElement.textContent = username;
    }

    if (this.opponentNameElement && opponent) {
      this.opponentNameElement.textContent = opponent;
    }
  }

  /**
   * プレイヤーアバターを表示
   */
  async displayPlayerAvatars(username: string, opponent: string | undefined): Promise<void> {
    if (!this.playerAvatarImg || !this.opponentAvatarImg) return;

    // プレイヤーアバターの取得と表示
    if (username) {
      const avatar = await fetchUserAvatar(username);
      if (avatar && avatar.type.startsWith('image/')) {
        const avatarUrl = URL.createObjectURL(avatar);
        this.playerAvatarImg.src = avatarUrl;
      } else {
        this.playerAvatarImg.src = `${API_URL}/media/default_avatar.png`;
      }
      this.playerAvatarImg.alt = username;
    }

    // 対戦相手アバターの取得と表示
    if (opponent) {
      const avatar = await fetchUserAvatar(opponent);
      if (avatar && avatar.type.startsWith('image/')) {
        const avatarUrl = URL.createObjectURL(avatar);
        this.opponentAvatarImg.src = avatarUrl;
      } else {
        this.opponentAvatarImg.src = `${API_URL}/media/default_avatar.png`;
      }
      this.opponentAvatarImg.alt = opponent;
    }
  }

  /**
   * スコアを表示
   */
  displayScores(player1Score: number, player2Score: number): void {
    if (this.playerScoreElement) {
      this.playerScoreElement.textContent = String(player1Score);
    }

    if (this.opponentScoreElement) {
      this.opponentScoreElement.textContent = String(player2Score);
    }
  }

  /**
   * 勝敗結果メッセージを表示
   */
  displayResultMessage(message: string, className: string): void {
    if (this.resultMessage) {
      this.resultMessage.textContent = message;
      this.resultMessage.className = className;
    }
  }

  /**
   * 結果画面全体の更新
   */
  async updateResultView(
    score: IGameResult,
    username: string,
    resultInfo: {
      message: string;
      className: string;
    }
  ): Promise<void> {
    // スコア表示
    this.displayScores(score.player1, score.player2);

    // プレイヤー名表示
    this.displayPlayerNames(username, score.opponent);

    // アバター表示
    await this.displayPlayerAvatars(username, score.opponent);

    // 勝敗メッセージ表示
    this.displayResultMessage(resultInfo.message, resultInfo.className);
  }
}