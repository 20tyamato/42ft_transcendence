// GameRenderer.ts
import * as THREE from 'three';
import Background from './Background';

export default class GameRenderer {
  public renderTarget: THREE.WebGLRenderTarget;
  public gameScene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public background: Background;

  constructor(private renderer: THREE.WebGLRenderer) {
    // レンダリングターゲットの作成（サイズは適宜調整）
    this.renderTarget = new THREE.WebGLRenderTarget(450, 300);
    this.gameScene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 5000);
    this.camera.position.set(0, 200, 1000);
    this.camera.lookAt(0, 0, 0);

    // ゲーム（背景）のシーンを生成する
    this.background = new Background(this.gameScene);
  }

  public update(): void {
    this.background.update();
    // レンダリングターゲットにゲームシーンをレン   ダリング
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(this.gameScene, this.camera);
    this.renderer.setRenderTarget(null);
  }
}
