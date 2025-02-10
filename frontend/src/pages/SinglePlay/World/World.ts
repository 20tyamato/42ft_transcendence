import Experience from '../Game/Experience';
import Model from './Model';
import * as THREE from 'three';

export default class World {
  private experience: Experience;
  private scene: THREE.Scene;
  private resources: any;
  private model?: Model;

  constructor(canvas: HTMLCanvasElement) {
    this.experience = new Experience(canvas);
    this.scene = this.experience.scene;

    this.model = new Model(canvas);
  }

  update(): void {
    if (this.model) {
      this.model.update();
    }
  }
}
