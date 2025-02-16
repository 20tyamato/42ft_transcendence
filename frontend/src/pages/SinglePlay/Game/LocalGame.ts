import gsap from 'gsap';
import Experience from './Experience';
import * as THREE from 'three';

export default class LocalGame {
  private experience: Experience;
  private canvas: HTMLCanvasElement;
  private time: THREE.Clock;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private field: THREE.Mesh;
  private ball: THREE.Mesh;
  private ballMaterial: THREE.Material;
  private paddleTwo: THREE.Mesh;
  private paddleOne: THREE.Mesh;

  private leftKeyPressed: boolean = false;
  private rightKeyPressed: boolean = false;
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
    this.field = this.experience.field as unknown as THREE.Mesh; // Assuming 'field' is of type THREE.Mesh
    this.ball = this.experience.ball.ball;
    this.ballMaterial = this.experience.ball.ballMaterial;
    this.paddleTwo = this.experience.paddle.paddleTwo;
    this.paddleOne = this.experience.paddle.paddleOne;

    this.handleKeyboard();
  }

  private startBallMovement() {
    let direction = Math.random() > 0.5 ? -1 : 1;
    this.ballVelocity = { x: 0, z: direction * 0.2 };
    this.ballStopped = false;
  }

  private processCpuPaddle() {
    const ballPos = this.ball.position;
    const cpuPos = this.paddleTwo.position;
    if (cpuPos.x > ballPos.x && cpuPos.x > -450) cpuPos.x -= 5;
    if (cpuPos.x < ballPos.x && cpuPos.x < 450) cpuPos.x += 5;
  }

  private processBallMovement() {
    if (!this.ballVelocity) this.startBallMovement();
    if (this.ballStopped) return;

    this.ball.position.x += this.ballVelocity?.x ?? 0;
    this.ball.position.z += this.ballVelocity?.z ?? 0;

    if (this.isSideCollision()) this.ballVelocity?.x ?? 0;
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
    return Math.abs(this.ball.position.x) > 450;
  }

  private isPaddleCollision(paddle: THREE.Mesh): boolean {
    return Math.abs(this.ball.position.z - paddle.position.z) < 10;
  }

  private hitBallBack(paddle: THREE.Mesh) {
    if (this.ballVelocity) {
      this.ballVelocity.x = (this.ball.position.x - paddle.position.x) / 5;
      this.ballVelocity.z *= -1;
    }
  }

  private scored(player: string) {
    this.stopBall();
    gsap.to(this.ballMaterial, { opacity: 0, duration: 0.5 });
    setTimeout(() => this.reset(), 600);
    if (player === 'paddleOne') this.scorePaddleOne++;
    else this.scorePaddleTwo++;
  }

  private stopBall() {
    this.ballStopped = true;
  }

  private reset() {
    this.ball.position.set(0, 0, 0);
    gsap.to(this.ballMaterial, { opacity: 1, duration: 0.5 });
    this.ballVelocity = null;
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

  update() {
    this.processBallMovement();
    this.processCpuPaddle();
  }
}
