import * as THREE from 'three';
import { IGameState } from '../Game/type';

export class GameRenderer {
  // フィールド・パドル・ボールなどの定数
  private readonly FIELD_WIDTH = 1200;
  private readonly FIELD_LENGTH = 3000;
  private readonly FIELD_THICKNESS = 10;
  private readonly FIELD_COLOR = 0x001a33;

  private readonly WALL_HEIGHT = 40;
  private readonly WALL_THICKNESS = 20;
  private readonly WALL_COLOR = 0x00aaff;

  private readonly PADDLE_WIDTH = 200;
  private readonly PADDLE_HEIGHT = 30;
  private readonly PADDLE_DEPTH = 20;
  private readonly PADDLE_COLOR = 0x00d4ff;
  private readonly PLAYER_OFFSET = 200;

  private readonly BALL_RADIUS = 30;
  private readonly BALL_SEGMENTS_WIDTH = 32;
  private readonly BALL_SEGMENTS_HEIGHT = 32;
  private readonly BALL_COLOR = 0xffffff;
  private readonly BALL_OPACITY = 0.9;
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
  private readonly AMBIENT_LIGHT_INTENSITY = 1.5;
  private readonly POINT_LIGHT_INTENSITY = 2.0;
  private readonly POINT_LIGHT_HEIGHT = 600;

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

  // removeEventListener で正しく解除するためにバインド済みハンドラを保持
  private boundOnWindowResize: () => void;
  private boundOnKeyDown: (event: KeyboardEvent) => void;

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

    this.boundOnWindowResize = this.onWindowResize.bind(this);
    this.boundOnKeyDown = this.onKeyDown.bind(this);

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

    // 背景色・フォグ
    this.scene.background = new THREE.Color(0x000d1a);
    this.scene.fog = new THREE.Fog(0x000d1a, 3000, 8000);

    // フィールドの作成
    const fieldGeometry = new THREE.BoxGeometry(
      this.FIELD_WIDTH,
      this.FIELD_THICKNESS,
      this.FIELD_LENGTH
    );
    const fieldMaterial = new THREE.MeshStandardMaterial({
      color: this.FIELD_COLOR,
      roughness: 0.8,
      metalness: 0.2,
    });
    const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
    this.scene.add(field);

    // 左右の側壁
    const sideWallGeometry = new THREE.BoxGeometry(
      this.WALL_THICKNESS,
      this.WALL_HEIGHT,
      this.FIELD_LENGTH
    );
    const sideWallMaterial = new THREE.MeshStandardMaterial({
      color: this.WALL_COLOR,
      emissive: new THREE.Color(this.WALL_COLOR),
      emissiveIntensity: 0.3,
      roughness: 0.4,
      metalness: 0.6,
    });
    const leftWall = new THREE.Mesh(sideWallGeometry, sideWallMaterial);
    leftWall.position.set(-this.FIELD_WIDTH / 2 - this.WALL_THICKNESS / 2, this.WALL_HEIGHT / 2, 0);
    this.scene.add(leftWall);

    const rightWall = new THREE.Mesh(sideWallGeometry, sideWallMaterial);
    rightWall.position.set(this.FIELD_WIDTH / 2 + this.WALL_THICKNESS / 2, this.WALL_HEIGHT / 2, 0);
    this.scene.add(rightWall);

    // センターライン
    const centerLineGeometry = new THREE.BoxGeometry(this.FIELD_WIDTH, 2, 4);
    const centerLineMaterial = new THREE.MeshStandardMaterial({
      color: 0x004466,
      emissive: new THREE.Color(0x004466),
      emissiveIntensity: 0.5,
    });
    const centerLine = new THREE.Mesh(centerLineGeometry, centerLineMaterial);
    centerLine.position.set(0, 1, 0);
    this.scene.add(centerLine);

    // ボールの作成
    const ballGeometry = new THREE.SphereGeometry(
      this.BALL_RADIUS,
      this.BALL_SEGMENTS_WIDTH,
      this.BALL_SEGMENTS_HEIGHT
    );
    const ballMaterial = new THREE.MeshStandardMaterial({
      color: this.BALL_COLOR,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.5,
      roughness: 0.1,
      metalness: 0.8,
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
    const ambientLight = new THREE.AmbientLight(0xffffff, this.AMBIENT_LIGHT_INTENSITY);
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, this.POINT_LIGHT_INTENSITY);
    pointLight.position.set(0, this.POINT_LIGHT_HEIGHT, 0);
    this.scene.add(pointLight);

    // プレイヤー1側（青系アクセントライト）
    const player1Light = new THREE.PointLight(0x0044ff, 1.5, 2000);
    player1Light.position.set(0, 200, this.FIELD_LENGTH / 2);
    this.scene.add(player1Light);

    // プレイヤー2側（オレンジ系アクセントライト）
    const player2Light = new THREE.PointLight(0xff6600, 1.5, 2000);
    player2Light.position.set(0, 200, -this.FIELD_LENGTH / 2);
    this.scene.add(player2Light);
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
    window.addEventListener('resize', this.boundOnWindowResize);
    window.addEventListener('keydown', this.boundOnKeyDown);
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
      const isOwnPaddle =
        (this.isPlayer1 && z > 0) || (!this.isPlayer1 && z < 0);
      const paddleColor = isOwnPaddle ? 0x00d4ff : 0xff6600;
      const paddleMaterial = new THREE.MeshStandardMaterial({
        color: paddleColor,
        emissive: new THREE.Color(paddleColor),
        emissiveIntensity: 0.4,
        roughness: 0.3,
        metalness: 0.7,
      });
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
      this.animationFrameId = null;
    }
    window.removeEventListener('resize', this.boundOnWindowResize);
    window.removeEventListener('keydown', this.boundOnKeyDown);

    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach((m) => m.dispose());
        } else if (object.material instanceof THREE.Material) {
          object.material.dispose();
        }
      }
    });
    this.scene.clear();
    this.renderer.dispose();
  }

  // 特定プレイヤーのパドル位置を取得する関数
  public getPaddlePosition(username: string): number | null {
    const paddle = this.paddles.get(username);
    return paddle ? paddle.position.x : null;
  }
}
