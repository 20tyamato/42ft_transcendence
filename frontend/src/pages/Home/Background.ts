// Background.ts
import * as THREE from 'three';

export default class Background {
  private scene: THREE.Scene;
  private plane: THREE.Mesh | null = null;
  private clock: THREE.Clock;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.clock = new THREE.Clock();
    this.createBackground();
  }

  private createBackground(): void {
    // 幅3000、高さ3000、100×100分割の平面ジオメトリ（細かい分割で滑らかな変形が可能）
    const geometry = new THREE.PlaneGeometry(3000, 3000, 100, 100);
    const material = new THREE.MeshNormalMaterial({
      wireframe: true,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    this.plane = new THREE.Mesh(geometry, material);
    // 上空から見下ろすため、平面を水平に配置（X-Z平面）
    this.plane.rotation.x = -Math.PI / 2;
    // 少し下に配置してカメラと被らないように
    this.plane.position.y = -50;
    this.scene.add(this.plane);
  }

  public update(): void {
    const time = this.clock.getElapsedTime();
    if (!this.plane) {
      console.warn('Plane is not initialized.');
      return;
    }
    const geometry = this.plane.geometry as THREE.PlaneGeometry;
    const positions = geometry.attributes.position.array as Float32Array;
    const amplitude = 20; // 波の振幅（調整可能）
    const frequency = 0.002; // 波の周波数（ゆっくり動く）
    const phase = time * 0.5; // 時間に応じた位相の変化

    // 各頂点の z 座標をサイン・コサイン波で変形させる
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      // 2つの波を組み合わせて、より複雑な動きを実現
      const offset =
        Math.sin(x * frequency + phase) * amplitude +
        Math.cos(y * frequency + phase) * amplitude * 0.5;
      positions[i + 2] = offset;
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
  }
}
