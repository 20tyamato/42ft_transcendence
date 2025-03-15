// Stars.ts
import * as THREE from 'three';

export default class Stars {
  private group: THREE.Group;
  private points: THREE.Points | null = null;
  private clock: THREE.Clock;

  constructor(scene: THREE.Scene) {
    this.clock = new THREE.Clock();
    this.group = new THREE.Group();
    this.createStars();
    scene.add(this.group);
  }

  private createStars(): void {
    const starCount = 5000; // 控えめな数
    const positions = new Float32Array(starCount * 3);
    const range = 1500; // 配置範囲

    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * range;
      positions[i * 3 + 1] = (Math.random() - 0.5) * range;
      positions[i * 3 + 2] = (Math.random() - 0.5) * range;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });

    this.points = new THREE.Points(geometry, material);
    this.group.add(this.points);
  }

  public update(): void {
    const delta = this.clock.getDelta();
    this.group.rotation.y += delta * 0.01;
    this.group.rotation.x += delta * 0.01;
  }
}
