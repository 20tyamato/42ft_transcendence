import Experience from '../Game/Experience';
import * as THREE from 'three';

export default class CameraLerp {
  private experience: Experience;
  private scene: THREE.Scene;
  private mouseX: number = 0;
  private mouseY: number = 0;
  private targetX: number = 0;
  private targetY: number = 0;
  private windowHalfX: number = window.innerWidth / 2;
  private windowHalfY: number = window.innerHeight / 2;
  private lerpActive: boolean = true;

  constructor(canvas: HTMLCanvasElement) {
    this.experience = Experience.getInstance(canvas);
    this.scene = this.experience.scene;

    this.setupMouseEvents();
  }

  private setupMouseEvents(): void {
    window.addEventListener('mousemove', (event: MouseEvent) => {
      this.mouseX = event.clientX - this.windowHalfX;
      this.mouseY = event.clientY - this.windowHalfY;
    });
  }

  update(): void {
    if (this.lerpActive) {
      this.targetX = this.mouseX * 0.09;
      this.targetY = this.mouseY * 0.09;

      this.scene.position.y += 0.07 * (this.targetY - this.scene.position.y);
      this.scene.position.x += 0.07 * (this.targetX - this.scene.position.x);
    }
  }
}
