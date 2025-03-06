import * as THREE from 'three';
import { IGameState } from '../Game/type';

export class GameRenderer {
  // フィールド・パドル・ボールなどの定数
  private readonly FIELD_WIDTH = 1200;
  private readonly FIELD_LENGTH = 2400;
  private readonly FIELD_THICKNESS = 10;
  private readonly FIELD_COLOR = 0x003300;

  private readonly WALL_THICKNESS = 10;
  private readonly WALL_Y_OFFSET = 5;
  private readonly WALL_COLOR = 0x003300;

  private readonly PADDLE_WIDTH = 200;
  private readonly PADDLE_HEIGHT = 30;
  private readonly PADDLE_DEPTH = 20;
  private readonly PADDLE_COLOR = 0xcccccc;
  private readonly PLAYER_OFFSET = 100;

  private readonly BALL_RADIUS = 30;
  private readonly BALL_SEGMENTS_WIDTH = 32;
  private readonly BALL_SEGMENTS_HEIGHT = 32;
  private readonly BALL_COLOR = 0xffffff;
  private readonly BALL_OPACITY = 0.8;
  private readonly BALL_SPEED_MULTIPLIER = 1000.0;
  private readonly BALL_LAUNCH_DISTANCE = 500;

  private readonly PADDLE_SPEED_MULTIPLIER = 1000.0;
  private readonly KEY_MOVE_AMOUNT = 300;

  // カメラ関連定数
  private readonly CAMERA_FOV = 45;
  private readonly CAMERA_NEAR = 0.1;
  private readonly CAMERA_FAR = 10000;
  private readonly CAMERA_HEIGHT = 200;
  private readonly CAMERA_DISTANCE_OFFSET = 1000;

  // ライティング関連定数
  private readonly AMBIENT_LIGHT_INTENSITY = 2;
  private readonly POINT_LIGHT_INTENSITY = 1.5;
  private readonly POINT_LIGHT_HEIGHT = 500;

  // Three.js関連
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

  constructor(container: HTMLElement, isPlayer1: boolean) {
    this.isPlayer1 = isPlayer1;
    this.paddles = new Map();
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      this.CAMERA_FOV,
      window.innerWidth / window.innerHeight,
      this.CAMERA_NEAR,
      this.CAMERA_FAR
    );
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.ball = new THREE.Mesh();

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
    this.renderer.setPixelRatio(window.devicePixelRatio);
  }

  // シーンとオブジェクトの初期化
  private initializeScene(container: HTMLElement) {
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height);
    container.appendChild(this.renderer.domElement);

    // フィールドの作成
    const fieldGeometry = new THREE.BoxGeometry(
      this.FIELD_WIDTH,
      this.FIELD_THICKNESS,
      this.FIELD_LENGTH
    );
    const fieldMaterial = new THREE.MeshLambertMaterial({ color: this.FIELD_COLOR });
    const field = new THREE.Mesh(fieldGeometry, fieldMaterial);

    // 周りに壁を作成する
    const wallGeometry = new THREE.BoxGeometry(
      this.FIELD_WIDTH,
      this.FIELD_THICKNESS,
      this.WALL_THICKNESS
    );
    const wallMaterial = new THREE.MeshLambertMaterial({ color: this.WALL_COLOR });
    const wall1 = new THREE.Mesh(wallGeometry, wallMaterial);
    wall1.position.set(0, this.WALL_Y_OFFSET, this.FIELD_LENGTH / 2);
    const wall2 = new THREE.Mesh(wallGeometry, wallMaterial);
    wall2.position.set(0, this.WALL_Y_OFFSET, -this.FIELD_LENGTH / 2);
    field.add(wall1);
    field.add(wall2);
    this.scene.add(field);

    // ボールの作成
    const ballGeometry = new THREE.SphereGeometry(
      this.BALL_RADIUS,
      this.BALL_SEGMENTS_WIDTH,
      this.BALL_SEGMENTS_HEIGHT
    );
    const ballMaterial = new THREE.MeshStandardMaterial({
      color: this.BALL_COLOR,
      wireframe: true,
      transparent: true,
      opacity: this.BALL_OPACITY,
    });
    this.ball = new THREE.Mesh(ballGeometry, ballMaterial);
    this.scene.add(this.ball);
  }

  // カメラの初期化
  private initializeCamera() {
    if (this.isPlayer1) {
      this.camera.position.set(
        0,
        this.CAMERA_HEIGHT,
        this.FIELD_LENGTH / 2 + this.CAMERA_DISTANCE_OFFSET
      );
    } else {
      this.camera.position.set(
        0,
        this.CAMERA_HEIGHT,
        -(this.FIELD_LENGTH / 2 + this.CAMERA_DISTANCE_OFFSET)
      );
      this.camera.rotation.y = Math.PI;
    }
    this.camera.lookAt(0, 0, 0);
  }

  // ライティングの初期化
  private initializeLighting() {
    const ambientLight = new THREE.AmbientLight(this.BALL_COLOR, this.AMBIENT_LIGHT_INTENSITY);
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(this.BALL_COLOR, this.POINT_LIGHT_INTENSITY);
    pointLight.position.set(0, this.POINT_LIGHT_HEIGHT, 0);
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
        z: this.isPlayer1
          ? this.FIELD_LENGTH / 2 - this.PLAYER_OFFSET
          : -this.FIELD_LENGTH / 2 + this.PLAYER_OFFSET,
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
      const paddleGeometry = new THREE.BoxGeometry(
        this.PADDLE_WIDTH,
        this.PADDLE_HEIGHT,
        this.PADDLE_DEPTH
      );
      const paddleMaterial = new THREE.MeshLambertMaterial({ color: this.PADDLE_COLOR });
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

    Object.keys(newState.players).forEach((username) => {
      const position = newState.players[username];
      this.createOrUpdatePaddle(username, position.x, position.z);
    });
  }

  // 初期ボール発射の設定（ランダムな方向）
  private launchInitialBall() {
    // ボールの位置を中心にリセット
    this.ball.position.set(0, this.ball.position.y, 0);

    const angle = Math.random() * 2 * Math.PI;
    this.targetBallPosition.set(
      this.ball.position.x + Math.cos(angle) * this.BALL_LAUNCH_DISTANCE,
      this.ball.position.y,
      this.ball.position.z + Math.sin(angle) * this.BALL_LAUNCH_DISTANCE
    );
  }

  // キー入力処理（矢印キーによるパドル操作）
  private onKeyDown(event: KeyboardEvent) {
    if (!this.currentState) return;
    const username = this.isPlayer1 ? 'player1' : 'player2';
    if (event.key === 'ArrowLeft') {
      this.currentState.players[username].x -= this.KEY_MOVE_AMOUNT;
    } else if (event.key === 'ArrowRight') {
      this.currentState.players[username].x += this.KEY_MOVE_AMOUNT;
    } else if (event.key === 'ArrowUp') {
      this.currentState.players[username].z -= this.KEY_MOVE_AMOUNT;
    } else if (event.key === 'ArrowDown') {
      this.currentState.players[username].z += this.KEY_MOVE_AMOUNT;
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
