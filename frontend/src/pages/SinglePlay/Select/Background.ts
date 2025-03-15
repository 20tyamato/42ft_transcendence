// Background.ts
import * as THREE from 'three';

export default class Background {
  private scene: THREE.Scene;
  private group: THREE.Group;

  // コンストラクターで必要な依存性（ここではシーン）を受け取る
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.createBackgroundObjects();
    this.scene.add(this.group);
  }

  private createBackgroundObjects(): void {
    const geometry = new THREE.BoxGeometry(50, 50, 50);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ffc6,
      wireframe: true,
      opacity: 0.5,
      transparent: true,
    });
    for (let i = 0; i < 20; i++) {
      const cube = new THREE.Mesh(geometry, material);
      cube.position.set(
        (Math.random() - 0.5) * 2000,
        (Math.random() - 0.5) * 2000,
        (Math.random() - 0.5) * 2000
      );
      cube.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      this.group.add(cube);
    }
  }

  public update(): void {
    this.group.rotation.y += 0.001;
  }
}
