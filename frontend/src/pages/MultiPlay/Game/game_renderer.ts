import * as THREE from 'three';

interface GameState {
  ball: {
    position: {
      x: number;
      y: number;
      z: number;
    };
    velocity: {
      x: number;
      y: number;
      z: number;
    };
  };
  players: {
    [key: string]: {
      x: number;
      z: number;
    };
  };
  score: {
    [key: string]: number;
  };
  is_active: boolean;
}

export class GameRenderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private ball: THREE.Mesh;
  private paddles: Map<string, THREE.Mesh>;
  private isPlayer1: boolean;
  private currentState: GameState | null = null;
  private animationFrameId: number | null = null;
  private lastRenderTime: number = 0;

  // 定数
  private readonly FIELD_WIDTH = 1200;
  private readonly FIELD_LENGTH = 3000;
  private readonly PADDLE_WIDTH = 200;
  private readonly PADDLE_HEIGHT = 30;
  private readonly BALL_RADIUS = 30;

  constructor(container: HTMLElement, isPlayer1: boolean) {
    this.isPlayer1 = isPlayer1;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      10000
    );
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.paddles = new Map();

    this.setupScene(container);
    this.setupCamera();
    this.setupLighting();

    window.addEventListener('resize', this.onWindowResize.bind(this));

    // レンダリングループを開始
    this.startRenderLoop();
  }

  private setupScene(container: HTMLElement) {
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height);
    container.appendChild(this.renderer.domElement);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // フィールドの作成
    const fieldGeometry = new THREE.BoxGeometry(this.FIELD_WIDTH, 5, this.FIELD_LENGTH);
    const fieldMaterial = new THREE.MeshLambertMaterial({ color: 0x003300 });
    const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
    field.position.y = -50;
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

  private setupCamera() {
    if (this.isPlayer1) {
      this.camera.position.set(0, 200, this.FIELD_LENGTH / 2 + 1000);
    } else {
      this.camera.position.set(0, 200, -(this.FIELD_LENGTH / 2 + 1000));
      this.camera.rotation.y = Math.PI;
    }
    this.camera.lookAt(0, 0, 0);
  }

  private setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 2);
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1.5);
    pointLight.position.set(0, 500, 0);
    this.scene.add(pointLight);
  }

  private createOrUpdatePaddle(username: string, x: number, z: number) {
    let paddle = this.paddles.get(username);

    if (!paddle) {
      const paddleGeometry = new THREE.BoxGeometry(this.PADDLE_WIDTH, this.PADDLE_HEIGHT, 10);
      const paddleMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc });
      paddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
      this.paddles.set(username, paddle);
      this.scene.add(paddle);
    }

    paddle.position.set(x, this.PADDLE_HEIGHT / 2, z);
  }

  private startRenderLoop() {
    const animate = (currentTime: number) => {
      // 前回のレンダリングからの経過時間を計算（秒単位）
      const deltaTime = this.lastRenderTime ? (currentTime - this.lastRenderTime) / 1000 : 0;
      this.lastRenderTime = currentTime;

      // 状態の補間処理
      if (this.currentState) {
        this.interpolateState(deltaTime);
      }

      // シーンのレンダリング
      this.renderer.render(this.scene, this.camera);

      // 次のフレームをリクエスト
      this.animationFrameId = requestAnimationFrame(animate);
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  private interpolateState(deltaTime: number) {
    // 必要に応じて状態の補間処理を実装
    // 現在は単純な更新のみ
  }

  public updateState(newState: GameState) {
    this.currentState = newState;

    // プレイヤー2の場合、Z座標を反転させる必要はない
    // （カメラが既に回転しているため）
    const ballPosition = {
      x: newState.ball.position.x,
      y: newState.ball.position.y,
      z: newState.ball.position.z,
    };

    // ボールの位置更新
    this.ball.position.set(ballPosition.x, ballPosition.y, ballPosition.z);

    // パドルの位置更新
    Object.entries(newState.players).forEach(([username, position]) => {
      // サーバーから送られてきた座標をそのまま使用
      this.createOrUpdatePaddle(username, position.x, position.z);
    });
  }

  private onWindowResize() {
    const container = this.renderer.domElement.parentElement;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public dispose() {
    // レンダリングループの停止
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    // イベントリスナーの削除
    window.removeEventListener('resize', this.onWindowResize.bind(this));

    // Three.jsのリソース解放
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

  public getPaddlePosition(username: string): number | null {
    const paddle = this.paddles.get(username);
    return paddle ? paddle.position.x : null;
  }
}
