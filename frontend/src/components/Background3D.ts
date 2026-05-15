// Background3D.ts - 共有3Dワイヤーフレーム背景コンポーネント
import { logger } from '@/core/Logger';
import * as THREE from 'three';

export default class Background3D {
  private scene: THREE.Scene;
  private plane: THREE.Mesh | null = null;
  private clock: THREE.Clock;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.clock = new THREE.Clock();
    this.createBackground();
  }

  private createBackground(): void {
    const geometry = new THREE.PlaneGeometry(3000, 3000, 150, 150);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
    });
    this.plane = new THREE.Mesh(geometry, material);
    this.plane.rotation.x = -Math.PI / 2;
    this.plane.position.y = -50;
    this.scene.add(this.plane);
  }

  public update(): void {
    const time = this.clock.getElapsedTime();
    if (!this.plane) {
      logger.warn('Plane is not initialized.');
      return;
    }
    const geometry = this.plane.geometry as THREE.PlaneGeometry;
    const positions = geometry.attributes.position.array as Float32Array;
    const amplitude = 15;
    const frequency = 0.001;
    const phase = time * 0.3;

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      const offset =
        Math.sin(x * frequency + phase) * amplitude +
        Math.cos(y * frequency + phase) * amplitude * 0.5;
      positions[i + 2] = offset;
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
  }
}
