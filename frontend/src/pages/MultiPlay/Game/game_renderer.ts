import { IGameState } from '@/models/interface';
import * as THREE from 'three';

export class GameRenderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private ball: THREE.Mesh;
  private paddles: Map<string, THREE.Mesh>;
  private isPlayer1: boolean;
  private currentState: IGameState | null = null;
  private animationFrameId: number | null = null;
  private lastRenderTime: number = 0;
  private targetBallPosition: THREE.Vector3 = new THREE.Vector3();

  // 定数（各種サイズ・スピード調整）
  private readonly FIELD_WIDTH = 1200;
  private readonly FIELD_LENGTH = 2400;
  private readonly PADDLE_WIDTH = 200;
  private readonly PADDLE_HEIGHT = 60;
  private readonly BALL_RADIUS = 30;
  private readonly BALL_SPEED_MULTIPLIER = 1000.0;
  private readonly PADDLE_SPEED_MULTIPLIER = 1000.0;

  constructor(container: HTMLElement, isPlayer1: boolean) {
    this.isPlayer1 = isPlayer1;
    this.paddles = new Map();
    this.scene = new THREE.Scene();

    this.initializeRenderer();
    this.initializeScene(container);
    this.initializeCamera();
    this.initializeLighting();
    this.initializeGameState();
    this.initializeEventListeners();

    this.launchInitialBall();
    this.startRenderLoop();
  }

  // レンダラーの初期化
  private initializeRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
  }

  // シーンとオブジェクトの初期化
  private initializeScene(container: HTMLElement) {
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height);
    container.appendChild(this.renderer.domElement);

    // フィールドの作成
    const fieldGeometry = new THREE.BoxGeometry(this.FIELD_WIDTH, 10, this.FIELD_LENGTH);
    const fieldMaterial = new THREE.MeshLambertMaterial({ color: 0x003300 });
    const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
    // 周りに壁を作成する
    const wallGeometry = new THREE.BoxGeometry(this.FIELD_WIDTH, 10, 10);
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x003300 });
    const wall1 = new THREE.Mesh(wallGeometry, wallMaterial);
    wall1.position.set(0, 5, this.FIELD_LENGTH / 2);
    const wall2 = new THREE.Mesh(wallGeometry, wallMaterial);
    wall2.position.set(0, 5, -this.FIELD_LENGTH / 2);
    field.add(wall1);
    field.add(wall2);
    this.scene.add(field);

    // ボールの作成
    const ballGeometry = new THREE.SphereGeometry(this.BALL_RADIUS, 32, 32);
    const ballMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.8,
    });
    this.ball = new THREE.Mesh(ballGeometry, ballMaterial);
    this.scene.add(this.ball);
  }

  // カメラの初期化
  private initializeCamera() {
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      10000
    );

    if (this.isPlayer1) {
      this.camera.position.set(0, 200, this.FIELD_LENGTH / 2 + 1000);
    } else {
      this.camera.position.set(0, 200, -(this.FIELD_LENGTH / 2 + 1000));
      this.camera.rotation.y = Math.PI;
    }
    this.camera.lookAt(0, 0, 0);
  }

  // ライティングの初期化
  private initializeLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 2);
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1.5);
    pointLight.position.set(0, 500, 0);
    this.scene.add(pointLight);
  }

  // ゲーム状態の初期化
  private initializeGameState() {
    if (!this.currentState) {
      this.currentState = {
        ball: {
          position: { x: 0, y: 0, z: 0 },
          velocity: { x: 0, y: 0, z: 0 },
        },
        players: {},
        score: {},
        is_active: false,
      };
      const username = this.isPlayer1 ? 'player1' : 'player2';
      this.currentState.players[username] = {
        x: 0,
        z: this.isPlayer1 ? this.FIELD_LENGTH / 2 - 100 : -this.FIELD_LENGTH / 2 + 100,
      };
    }
  }

  // イベントリスナーの設定
  private initializeEventListeners() {
    window.addEventListener('resize', this.onWindowResize.bind(this));
    window.addEventListener('keydown', this.onKeyDown.bind(this));
  }

  // プレイヤーのパドル作成または更新
  private createOrUpdatePaddle(username: string, x: number, z: number) {
    let paddle = this.paddles.get(username);
    if (!paddle) {
      const paddleGeometry = new THREE.BoxGeometry(this.PADDLE_WIDTH, this.PADDLE_HEIGHT, 20);
      const paddleMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc });
      paddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
      this.paddles.set(username, paddle);
      this.scene.add(paddle);
    }
    paddle.position.set(x, this.PADDLE_HEIGHT / 2, z);
  }

  // レンダリングループの開始
  private startRenderLoop() {
    const animate = (currentTime: number) => {
      const deltaTime = this.lastRenderTime ? (currentTime - this.lastRenderTime) / 1000 : 0;
      this.lastRenderTime = currentTime;

      if (this.currentState) {
        this.interpolateState(deltaTime);
      }

      this.renderer.render(this.scene, this.camera);
      this.animationFrameId = requestAnimationFrame(animate);
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  // 状態補間処理（ボールとパドルの位置補間）
  private interpolateState(deltaTime: number) {
    const lerpFactor = Math.min(deltaTime * this.BALL_SPEED_MULTIPLIER, 1);
    this.ball.position.lerp(this.targetBallPosition, lerpFactor);

    this.paddles.forEach((paddle, username) => {
      const playerState = this.currentState!.players[username];
      if (playerState) {
        const diffX = playerState.x - paddle.position.x;
        const diffZ = playerState.z - paddle.position.z;
        paddle.position.x += diffX * deltaTime * this.PADDLE_SPEED_MULTIPLIER;
        paddle.position.z += diffZ * deltaTime * this.PADDLE_SPEED_MULTIPLIER;
      }
    });
  }

  // 外部から状態更新を受け付ける関数
  public updateState(newState: IGameState) {
    this.currentState = newState;
    this.targetBallPosition.set(
      newState.ball.position.x,
      newState.ball.position.y,
      newState.ball.position.z
    );

    Object.entries(newState.players).forEach(([username, position]) => {
      this.createOrUpdatePaddle(username, position.x, position.z);
    });
  }

  // 初期ボール発射の設定（ランダムな方向）
  private launchInitialBall() {
    // ボールの位置を毎回中心にリセットする
    this.ball.position.set(0, this.ball.position.y, 0);

    const angle = Math.random() * 2 * Math.PI;
    const distance = 500;
    this.targetBallPosition.set(
      this.ball.position.x + Math.cos(angle) * distance, // x 軸は cos(angle)
      this.ball.position.y, // y 軸は固定
      this.ball.position.z + Math.sin(angle) * distance // z 軸は sin(angle)
    );
  }

  // キー入力処理（矢印キーによるパドル操作）
  private onKeyDown(event: KeyboardEvent) {
    if (!this.currentState) return;
    const username = this.isPlayer1 ? 'player1' : 'player2';
    const moveAmount = 300;
    if (event.key === 'ArrowLeft') {
      this.currentState.players[username].x -= moveAmount;
    } else if (event.key === 'ArrowRight') {
      this.currentState.players[username].x += moveAmount;
    } else if (event.key === 'ArrowUp') {
      this.currentState.players[username].z -= moveAmount;
    } else if (event.key === 'ArrowDown') {
      this.currentState.players[username].z += moveAmount;
    }
    const paddle = this.paddles.get(username);
    if (paddle && this.currentState.players[username]) {
      paddle.position.x = this.currentState.players[username].x;
      paddle.position.z = this.currentState.players[username].z;
    }
  }

  // ウィンドウリサイズ時の処理
  private onWindowResize() {
    const container = this.renderer.domElement.parentElement;
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // リソース解放・イベント解除処理
  public dispose() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onWindowResize.bind(this));
    window.removeEventListener('keydown', this.onKeyDown.bind(this));
    this.renderer.dispose();
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        }
      }
    });
  }

  // 特定プレイヤーのパドル位置を取得する関数
  public getPaddlePosition(username: string): number | null {
    const paddle = this.paddles.get(username);
    return paddle ? paddle.position.x : null;
  }
}
