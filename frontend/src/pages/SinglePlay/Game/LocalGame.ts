import i18next from '@/config/i18n';
import { logger } from '@/core/Logger';
import { createSinglePlayGame } from '@/models/Game/repository';
import gsap from 'gsap';
import * as THREE from 'three';
import Experience from './Experience';
let running = true;

export default class LocalGame {
  private experience: Experience;
  public canvas: HTMLCanvasElement;
  public time: THREE.Clock;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public field: THREE.Mesh;
  public ball: THREE.Mesh;
  public ballMaterial: THREE.Material;
  public paddleTwo: THREE.Mesh;
  public paddleOne: THREE.Mesh;

  public leftKeyPressed: boolean = false;
  public rightKeyPressed: boolean = false;
  private scorePaddleOne: number = 0;
  private scorePaddleTwo: number = 0;
  private ballVelocity: { x: number; z: number } | null = null;
  private ballStopped: boolean = true;
  private lastScorer: 'paddleOne' | 'paddleTwo' | null = null;
  private gameStarted: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    /* ゲームエンジンのインスタンスを取得 */
    this.experience = Experience.getInstance(canvas);
    this.canvas = canvas;
    this.time = new THREE.Clock();
    this.scene = this.experience.scene;
    this.camera = this.experience.camera as unknown as THREE.PerspectiveCamera;
    this.field = this.experience.field as unknown as THREE.Mesh;
    this.ball = this.experience.ball.ball;
    this.ballMaterial = this.experience.ball.ballMaterial;
    this.paddleTwo = this.experience.paddle.paddleTwo;
    this.paddleOne = this.experience.paddle.paddleOne;

    setTimeout(() => {
      this.gameStarted = true;
      this.startBallMovement();
    }, 1500);

    this.startBallMovement();
    this.handleKeyboard();
  }

  private startBallMovement() {
    let direction: number;
    // 最後に得点したプレイヤーの方向にボールを発射
    if (this.lastScorer === 'paddleOne') {
      direction = 1;
    } else if (this.lastScorer === 'paddleTwo') {
      direction = -1;
    } else {
      direction = Math.random() > 0.5 ? -1 : 1; // 初回のみランダム
    }

    this.ballVelocity = {
      x: 0,
      z: direction * 10.0 * difficultyFactor,
    };
    this.ballStopped = false;
  }

  private cpuTargetX: number = 0;
  private cpuDecisionTimer: number = 0;

  private processCpuPaddle() {
    const ballPos = this.ball.position;
    const cpuPos = this.paddleTwo.position;

    // 一定間隔でのみ新しい目標位置を決定（難易度に応じて頻度変更）
    this.cpuDecisionTimer -= 1;
    if (this.cpuDecisionTimer <= 0) {
      // 低難易度ほど意思決定間隔が長い（動きがゆっくり変わる）
      this.cpuDecisionTimer = 30 - difficultyFactor * 2; // 10~26フレーム間隔

      // 難易度に応じたボール位置の「見誤り」
      const errorAmount = ((Math.random() - 0.5) * 300 * (11 - difficultyFactor)) / 10;
      this.cpuTargetX = ballPos.x + errorAmount;
    }

    // 目標位置に向かってスムーズに移動（イージングのような効果）
    const moveSpeed = 2 + difficultyFactor / 3; // 2.7~5.3の範囲
    const distanceToTarget = this.cpuTargetX - cpuPos.x;

    // 距離に応じた移動速度（近いほど遅く、スムーズに減速）
    const movement =
      Math.sign(distanceToTarget) * Math.min(Math.abs(distanceToTarget) * 0.1, moveSpeed);

    // 移動制限を適用
    if ((movement < 0 && cpuPos.x > -650) || (movement > 0 && cpuPos.x < 650)) {
      cpuPos.x += movement;
    }
  }

  private processBallMovement() {
    if (!this.ballVelocity) this.startBallMovement();
    if (this.ballStopped) return;

    this.ball.position.x += this.ballVelocity?.x ?? 0;
    this.ball.position.z += this.ballVelocity?.z ?? 0;

    if (this.isSideCollision()) {
      this.ballVelocity!.x *= -1;
    }
    if (this.isPaddleCollision(this.paddleOne)) this.hitBallBack(this.paddleOne);
    if (this.isPaddleCollision(this.paddleTwo)) this.hitBallBack(this.paddleTwo);
    if (this.isPastPaddle(this.paddleOne)) this.scored('paddleTwo');
    if (this.isPastPaddle(this.paddleTwo)) this.scored('paddleOne');
  }

  private isPastPaddle(paddle: THREE.Mesh): boolean {
    return paddle === this.paddleOne
      ? this.ball.position.z > paddle.position.z + 100
      : this.ball.position.z < paddle.position.z - 100;
  }

  private isSideCollision(): boolean {
    return Math.abs(this.ball.position.x) > this.experience.FIELD_WIDTH / 2;
  }

  private isPaddleCollision(paddle: THREE.Mesh): boolean {
    const hitX = Math.abs(this.ball.position.x - paddle.position.x) < 75; // パドル幅考慮
    const hitZ = Math.abs(this.ball.position.z - paddle.position.z) < 10;
    return hitX && hitZ;
  }

  private hitBallBack(paddle: THREE.Mesh) {
    if (this.ballVelocity) {
      this.ballVelocity.x = (this.ball.position.x - paddle.position.x) / 5;
      this.ballVelocity.z *= -1;
    }
  }
  public showGameOverOverlay(message: string, finalScore: string) {
    const scoreDisplay = document.getElementById('scoreDisplay');
    if (scoreDisplay) scoreDisplay.style.display = 'none';
    const pauseOverlay = document.getElementById('pauseOverlay');
    if (pauseOverlay) pauseOverlay.style.display = 'none';
    const gameStartOverlay = document.getElementById('gameStartOverlay');
    if (gameStartOverlay) gameStartOverlay.style.display = 'none';

    const overlay = document.getElementById('gameOverOverlay');
    const endMessage = document.getElementById('endMessage');

    const finalPlayerNameElem = document.querySelector(
      '#finalScoreDisplay #finalPlayerName .leftName'
    );
    const finalCpuLabelElem = document.querySelector(
      '#finalScoreDisplay #finalPlayerName .rightName'
    );
    const finalPlayerScoreElem = document.querySelector(
      '#finalScoreDisplay #finalScore .playerScore'
    );
    const finalDashElem = document.querySelector('#finalScoreDisplay #finalScore .dash');
    const finalCpuScoreElem = document.querySelector('#finalScoreDisplay #finalScore .cpuScore');

    if (
      overlay &&
      endMessage &&
      finalPlayerNameElem &&
      finalCpuLabelElem &&
      finalPlayerScoreElem &&
      finalDashElem &&
      finalCpuScoreElem
    ) {
      const username = localStorage.getItem('username') || 'Player';
      finalPlayerNameElem.textContent = username;
      // 右側はゲーム内で変更があれば更新
      finalCpuLabelElem.textContent = 'CPU';
      // ここでは、finalScore を "X - Y" として受け取る場合、分割して更新する
      const [playerScore, cpuScore] = finalScore.split('-').map((s) => s.trim());
      finalPlayerScoreElem.textContent = playerScore;
      finalDashElem.textContent = '-';
      finalCpuScoreElem.textContent = cpuScore;

      endMessage.textContent = message; // "GAME OVER" または "YOU WIN!"

      overlay.classList.remove('hidden');
      gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 1 });

      const retryBtn = document.getElementById('gameOverRetryBtn');
      if (retryBtn) {
        retryBtn.onclick = () => window.location.reload();
      }
      const exitBtn = document.getElementById('gameOverExitBtn');
      if (exitBtn) {
        exitBtn.onclick = () => (window.location.href = '/singleplay/select');
      }
    } else {
      logger.warn('Game over elements are missing.');
    }
  }
  private scored(player: string) {
    this.stopBall();
    this.lastScorer = player as 'paddleOne' | 'paddleTwo';
    gsap.to(this.ballMaterial, { opacity: 0, duration: 0.5 });

    setTimeout(() => {
      this.reset();
      this.updateScoreDisplay();
    }, 600);

    player === 'paddleOne' ? this.scorePaddleOne++ : this.scorePaddleTwo++;

    const isFinishGame = this.scorePaddleOne >= 3 || this.scorePaddleTwo >= 3;
    if (isFinishGame) {
      running = false;
      const isPlayerWin = this.scorePaddleOne >= 3;

      this.showGameOverOverlay(
        isPlayerWin ? i18next.t('singlePlay.youWin') : i18next.t('singlePlay.gameOver'),
        `${this.scorePaddleOne} - ${this.scorePaddleTwo}`
      );

      createSinglePlayGame({
        playerScore: this.scorePaddleOne,
        cpuScore: this.scorePaddleTwo,
        difficultyFactor: difficultyFactor,
      });
      return;
    }
    this.updateScoreDisplay();
  }

  private stopBall() {
    this.ballStopped = true;
  }

  private reset() {
    this.ball.position.set(0, 0, 0);
    gsap.to(this.ballMaterial, { opacity: 1, duration: 0.5 });
    this.ballVelocity = null;
    this.ballStopped = false;
    // パドルを初期位置に戻す
    gsap.to(this.paddleOne.position, {
      x: 0,
      duration: 0.5,
      ease: 'power2.out',
    });

    gsap.to(this.paddleTwo.position, {
      x: 0,
      duration: 0.5,
      ease: 'power2.out',
    });
    this.updateScoreDisplay();
  }

  private handleKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') this.rightKeyPressed = true;
      if (e.key === 'ArrowLeft') this.leftKeyPressed = true;
    });
    document.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowRight') this.rightKeyPressed = false;
      if (e.key === 'ArrowLeft') this.leftKeyPressed = false;
    });
  }
  private processPlayerPaddle(deltaTime: number) {
    const paddleSpeed = 1500; // 1秒間に動くピクセル量

    if (this.leftKeyPressed && this.paddleOne.position.x > -675) {
      this.paddleOne.position.x -= paddleSpeed * deltaTime;
    }
    if (this.rightKeyPressed && this.paddleOne.position.x < 675) {
      this.paddleOne.position.x += paddleSpeed * deltaTime;
    }
  }

  private updateScoreDisplay(): void {
    const username = localStorage.getItem('username') || 'Player';
    const leftNameElem = document.querySelector('#playerName .leftName');
    const playerScoreElem = document.querySelector('#score .playerScore');
    const cpuScoreElem = document.querySelector('#score .cpuScore');

    if (leftNameElem) {
      leftNameElem.textContent = username;
    }
    if (playerScoreElem) {
      playerScoreElem.textContent = this.scorePaddleOne.toString();
    }
    if (cpuScoreElem) {
      cpuScoreElem.textContent = this.scorePaddleTwo.toString();
    }
  }

  update() {
    if (!running || !this.gameStarted) return;
    const deltaTime = this.time.getDelta();
    this.processBallMovement();
    this.processCpuPaddle();
    this.processPlayerPaddle(deltaTime);
  }
}

// Difficulty.ts
export enum Difficulty {
  EASY = 2,
  MEDIUM = 3,
  HARD = 5,
  ONI = 10,
}

const selectedLevel = localStorage.getItem('selectedLevel') || 'EASY';
logger.log(`Selected Level: ${selectedLevel}`);

let difficultyFactor: number;
switch (selectedLevel.toUpperCase()) {
  case 'EASY':
    difficultyFactor = Difficulty.EASY;
    break;
  case 'MEDIUM':
    difficultyFactor = Difficulty.MEDIUM;
    break;
  case 'HARD':
    difficultyFactor = Difficulty.HARD;
    break;
  case 'ONI':
    difficultyFactor = Difficulty.ONI;
    break;
  default:
    difficultyFactor = Difficulty.EASY;
}

export const getAiLevel = (difficultyFactor: Difficulty) => {
  switch (difficultyFactor) {
    case Difficulty.EASY:
      return 1;
    case Difficulty.MEDIUM:
      return 3;
    case Difficulty.HARD:
      return 5;
    case Difficulty.ONI:
      return 10;
  }
};
