// frontend/src/pages/MultiPlay/Game/game_renderer.ts
import * as THREE from 'three';
import { GameState } from './types';

export class GameRenderer {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private ball: THREE.Mesh;
    private paddle1: THREE.Mesh;
    private paddle2: THREE.Mesh;

    constructor(container: HTMLElement) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        
        this.setupScene(container);
    }

    private setupScene(container: HTMLElement) {
        // レンダラーの設定
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(this.renderer.domElement);

        // シーンの初期設定
        this.scene.add(new THREE.AmbientLight(0xffffff, 2));
        
        // ゲームオブジェクトの作成
        this.createGameObjects();
        
        // カメラの位置設定
        this.camera.position.set(0, 200, 1500);
        this.camera.lookAt(0, 0, 0);
    }

    private createGameObjects() {
        // ボール
        const ballGeometry = new THREE.SphereGeometry(30, 32, 32);
        const ballMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            wireframe: true 
        });
        this.ball = new THREE.Mesh(ballGeometry, ballMaterial);
        this.scene.add(this.ball);

        // パドル
        const paddleGeometry = new THREE.BoxGeometry(200, 30, 10);
        const paddleMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc });
        this.paddle1 = new THREE.Mesh(paddleGeometry, paddleMaterial);
        this.paddle2 = new THREE.Mesh(paddleGeometry, paddleMaterial);
        this.scene.add(this.paddle1);
        this.scene.add(this.paddle2);
    }

    public updateState(state: GameState) {
        // ボールの位置更新
        this.ball.position.set(
            state.ball.position.x,
            state.ball.position.y,
            state.ball.position.z
        );

        // パドルの位置更新
        const [p1, p2] = Object.values(state.players);
        this.paddle1.position.set(p1.x, 30, p1.z);
        this.paddle2.position.set(p2.x, 30, p2.z);
    }

    public render() {
        this.renderer.render(this.scene, this.camera);
    }
}