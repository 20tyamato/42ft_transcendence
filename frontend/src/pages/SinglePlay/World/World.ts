import Experience from '../Game/Experience';
import Model from './Model';
import * as THREE from 'three';

export default class World {
  private experience: Experience;
  private scene: THREE.Scene;
  private model?: Model;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.experience = Experience.getInstance(canvas);
    this.scene = this.experience.scene;
    this.canvas = this.experience.canvas;
    this.model = new Model(canvas);
  }

  update(): void {
    if (this.model) {
      this.model.update();
    }
  }
}
