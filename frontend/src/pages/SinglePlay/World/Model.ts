import Experience from '../Game/Experience';
import * as THREE from 'three';

export default class Model {
  private experience: Experience;
  private scene: THREE.Scene;
  private resources: any;
  private model!: THREE.Object3D;

  constructor(canvas: HTMLCanvasElement) {
    this.experience = Experience.getInstance(canvas);
    this.scene = this.experience.scene;
    this.resources = this.experience.resources;
    this.experience.resources.on('ready', () => {
      this.loadModel();
    });
  }

  private loadModel(): void {
    const resource = this.resources.items.model;
    if (!resource || !resource.scene) {
      console.error('Model resource is not loaded correctly.');
      return;
    }

    this.model = resource.scene;
    this.model.scale.set(12, 12, 12);
    this.model.position.set(0, -350, 600);
    this.scene.add(this.model);
  }

  update(): void {
    // 必要に応じてアニメーションなどを追加
  }
}
