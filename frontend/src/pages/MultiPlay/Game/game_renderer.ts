// frontend/src/pages/MultiPlay/Game/game_renderer.ts
import * as THREE from 'three';

interface GameState {
   ball: {
       position: {
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
}

export class GameRenderer {
   private scene: THREE.Scene;
   private camera: THREE.PerspectiveCamera;
   private renderer: THREE.WebGLRenderer;
   private ball: THREE.Mesh;
   private paddles: Map<string, THREE.Mesh>;
   private isPlayer1: boolean;

   // 定数
   private readonly FIELD_WIDTH = 1200;
   private readonly FIELD_LENGTH = 3000;
   private readonly PADDLE_WIDTH = 200;
   private readonly PADDLE_HEIGHT = 30;
   private readonly BALL_RADIUS = 30;

   constructor(container: HTMLElement, isPlayer1: boolean) {
       this.isPlayer1 = isPlayer1;
       this.scene = new THREE.Scene();
       this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000);
       this.renderer = new THREE.WebGLRenderer({ antialias: true });
       this.paddles = new Map();
       
       this.setupScene(container);
       this.setupCamera();
       this.setupLighting();
       
       // リサイズハンドラー
       window.addEventListener('resize', this.onWindowResize.bind(this));
   }

   private setupScene(container: HTMLElement) {
       const width = container.clientWidth || window.innerWidth;
       const height = container.clientHeight || window.innerHeight;
       this.renderer.setSize(width, height);
       container.appendChild(this.renderer.domElement);

       // レンダラーのピクセル比を設定
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
       // プレイヤーの視点に応じてカメラ位置を設定
       if (this.isPlayer1) {
           this.camera.position.set(0, 200, this.FIELD_LENGTH / 2 + 1000);
       } else {
           this.camera.position.set(0, 200, -(this.FIELD_LENGTH / 2 + 1000));
           this.camera.rotation.y = Math.PI; // 180度回転
       }
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

   public updateState(state: GameState) {
       // ボールの位置更新
       this.ball.position.set(
           state.ball.position.x,
           state.ball.position.y,
           state.ball.position.z
       );

       // パドルの位置更新
       Object.entries(state.players).forEach(([username, position]) => {
           this.createOrUpdatePaddle(username, position.x, position.z);
       });
   }

   public render() {
       this.renderer.render(this.scene, this.camera);
   }

   private onWindowResize() {
       this.camera.aspect = window.innerWidth / window.innerHeight;
       this.camera.updateProjectionMatrix();
       this.renderer.setSize(window.innerWidth, window.innerHeight);
   }

   public dispose() {
       // リソースの解放
       window.removeEventListener('resize', this.onWindowResize.bind(this));
       this.renderer.dispose();
       // Three.jsのメモリ解放
       this.scene.traverse((object) => {
           if (object instanceof THREE.Mesh) {
               object.geometry.dispose();
               if (object.material instanceof THREE.Material) {
                   object.material.dispose();
               }
           }
       });
   }
}