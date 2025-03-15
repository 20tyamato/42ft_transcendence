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
    // 分割数の多い平面ジオメトリを作成（十分な頂点数で波の変形を可能に）
    const geometry = new THREE.PlaneGeometry(2000, 2000, 100, 100);
    const material = new THREE.MeshNormalMaterial({
      wireframe: true,
      side: THREE.DoubleSide,
    });
    this.plane = new THREE.Mesh(geometry, material);
    // 平面を垂直に配置するために X 軸周りに -90° 回転
    this.plane.rotation.x = -Math.PI / 2;
    // 位置を若干下げて、カメラからの見た目で奥行きを感じるようにする
    this.plane.position.y = -10;
    this.scene.add(this.plane);
  }

  public update(): void {
    const time = this.clock.getElapsedTime();
    if (!this.plane) {
      console.warn('Plane is not initialized.');
      return;
    }
    const geometry = this.plane.geometry as THREE.PlaneGeometry;
    const positions = geometry.attributes.position as THREE.BufferAttribute;
    const waveAmplitude = 10; // 波の振幅
    const waveFrequency = 0.005; // 波の周波数

    // 各頂点のZ軸（ジオメトリ空間）にサイン波のオフセットを加える
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      // サイン波によりオフセットを計算
      const offset = Math.sin(x * waveFrequency + time) * waveAmplitude;
      positions.setZ(i, offset);
    }
    positions.needsUpdate = true;
    // 正確なライティングのため、頂点法線を再計算（必要なら）
    geometry.computeVertexNormals();
  }
}
