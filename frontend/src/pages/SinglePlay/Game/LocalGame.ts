import gsap from 'gsap';
import Experience from './Experience';
import * as THREE from 'three';
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

    this.startBallMovement();
    this.handleKeyboard();
  }

  private startBallMovement() {
    const direction = Math.random() > 0.5 ? -1 : 1;
    this.ballVelocity = { x: 0, z: direction * 10.0 * difficultyFactor }; //ボールの速度調整
    this.ballStopped = false;
  }

  private processCpuPaddle() {
    const ballPos = this.ball.position;
    const cpuPos = this.paddleTwo.position;
    if (cpuPos.x > ballPos.x && cpuPos.x > -450) cpuPos.x -= 5 * difficultyFactor;
    if (cpuPos.x < ballPos.x && cpuPos.x < 450) cpuPos.x += 5 * difficultyFactor;
  }

  private processBallMovement() {
    if (!this.ballVelocity) this.startBallMovement();
    if (this.ballStopped) return;

    this.ball.position.x += this.ballVelocity?.x ?? 0;
    this.ball.position.z += this.ballVelocity?.z ?? 0;

    if (this.isSideCollision()) {
      this.ballVelocity!.x *= -1; // 壁に当たったらボールのX方向を反転
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
    // 非表示にする既存のUIを隠す
    const scoreDisplay = document.getElementById('scoreDisplay');
    if (scoreDisplay) scoreDisplay.style.display = 'none';
    const pauseOverlay = document.getElementById('pauseOverlay');
    if (pauseOverlay) pauseOverlay.style.display = 'none';
    const gameStartOverlay = document.getElementById('gameStartOverlay');
    if (gameStartOverlay) gameStartOverlay.style.display = 'none';

    // ゲームオーバーオーバーレイの表示
    const overlay = document.getElementById('gameOverOverlay');
    const endMessage = document.getElementById('endMessage');
    const finalScoreElem = document.getElementById('finalScore');
    if (overlay && endMessage && finalScoreElem) {
      endMessage.textContent = message;
      finalScoreElem.textContent = `Score: ${finalScore}`;
      overlay.classList.remove('hidden');
      gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 1 });
    }

    // Retry/Exit ボタンのイベントを登録（重複登録に注意）
    const retryBtn = document.getElementById('gameOverRetryBtn');
    if (retryBtn) {
      retryBtn.onclick = () => window.location.reload();
    }
    const exitBtn = document.getElementById('gameOverExitBtn');
    if (exitBtn) {
      exitBtn.onclick = () => (window.location.href = '/singleplay/select');
    }
  }

  private scored(player: string) {
    this.stopBall();
    gsap.to(this.ballMaterial, { opacity: 0, duration: 0.5 });

    setTimeout(() => {
      this.reset();
      this.updateScoreDisplay();
    }, 600);

    if (player === 'paddleOne') {
      this.scorePaddleOne++;
      if (this.scorePaddleOne >= 3) {
        running = false;
        this.showGameOverOverlay('YOU WIN!', `${this.scorePaddleOne} - ${this.scorePaddleTwo}`);
        return;
      }
    } else {
      this.scorePaddleTwo++;
      if (this.scorePaddleTwo >= 3) {
        running = false;
        // CPUが勝利
        this.showGameOverOverlay('GAME OVER', `${this.scorePaddleOne} - ${this.scorePaddleTwo}`);
        return;
      }
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
    const paddleSpeed = 1000; // 1秒間に動くピクセル量

    if (this.leftKeyPressed && this.paddleOne.position.x > -450) {
      this.paddleOne.position.x -= paddleSpeed * deltaTime;
    }
    if (this.rightKeyPressed && this.paddleOne.position.x < 450) {
      this.paddleOne.position.x += paddleSpeed * deltaTime;
    }
  }

  private updateScoreDisplay() {
    const playerNameElem = document.getElementById('playerName');
    const scoreElem = document.getElementById('score');
    const username = localStorage.getItem('username') || 'Player';

    if (playerNameElem) {
      const leftNameSpan = playerNameElem.querySelector('.leftName');
      if (leftNameSpan) {
        leftNameSpan.textContent = username;
      }
    }
    if (scoreElem) {
      const playerScoreSpan = scoreElem.querySelector('.playerScore');
      const dashSpan = scoreElem.querySelector('.dash');
      const cpuScoreSpan = scoreElem.querySelector('.cpuScore');
      if (playerScoreSpan && dashSpan && cpuScoreSpan) {
        playerScoreSpan.textContent = this.scorePaddleOne.toString();
        dashSpan.textContent = '-';
        cpuScoreSpan.textContent = this.scorePaddleTwo.toString();
      }
    }
  }

  update() {
    if (!running) return;
    const deltaTime = this.time.getDelta();
    this.processBallMovement();
    this.processCpuPaddle();
    this.processPlayerPaddle(deltaTime);
  }
}

// Difficulty.ts
export enum Difficulty {
  EASY = 1,
  MEDIUM = 3,
  HARD = 5,
  ONI = 10, // ユーザーレベルが5以上の場合のみ選択可能
}

const selectedLevel = localStorage.getItem('selectedLevel') || 'EASY';
console.log(`Selected Level: ${selectedLevel}`);

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
    // ユーザーレベルのチェックは別途行い、条件を満たす場合のみ SECRET を適用
    difficultyFactor = Difficulty.ONI;
    break;
  default:
    difficultyFactor = Difficulty.EASY;
}
