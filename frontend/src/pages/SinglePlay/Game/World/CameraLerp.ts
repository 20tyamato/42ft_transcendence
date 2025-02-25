import * as THREE from 'three';
import Experience from '../Experience'; // 適切なパスに変更してください

export default class CameraLerp {
  private experience: Experience;
  private camera: THREE.PerspectiveCamera;
  private target: THREE.Vector3;
  private lerpSpeed: number;

  constructor(canvas: HTMLCanvasElement) {
    this.experience = Experience.getInstance(canvas);
    this.camera = this.experience.camera;
    this.target = new THREE.Vector3(0, 0, 0);
    this.lerpSpeed = 0.1;

    this.addMouseListeners();
  }

  private addMouseListeners(): void {
    window.addEventListener('mousemove', (event) => this.onMouseMove(event));
  }

  private onMouseMove(event: MouseEvent): void {
    const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

    // マウスの動きに基づいてターゲット位置を更新
    this.target.x = mouseX * 10;
    this.target.y = mouseY * 10;
  }

  public update(): void {
    // カメラの位置をターゲット位置に向かって補間
    this.camera.position.lerp(this.target, this.lerpSpeed);
    this.camera.lookAt(0, 0, 0);
  }
}
