import { logger } from '@/core/Logger';
import * as THREE from 'three';
import Experience from '../Experience';

export default class Model {
  private experience: Experience;
  private scene: THREE.Scene;
  private resources: THREE.LoadingManager;
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
    const resource = this.resources.items.scene;
    if (!resource || !resource.scene) {
      logger.error('Model resource is not loaded correctly.');
      return;
    }

    this.model = resource.scene;
    logger.info('GLTF resource structure:', resource);
    this.model.scale.set(12, 12, 12);
    this.model.position.set(0, -350, 600);
    this.scene.add(this.model);
  }

  update(): void {
    // 必要に応じてアニメーションなどを追加
  }
}
