// Field.ts
import * as THREE from 'three';
import Experience from './Experience';

export default class Field {
  // --- クラスプロパティの型定義 ---
  private experience: Experience;
  private scene: THREE.Scene;
  private FIELD_WIDTH: number;
  private FIELD_LENGTH: number;
  private particleSystem: THREE.Points;
  private particlePositions: Float32Array;
  private particleSpeeds: Float32Array;

  private fieldGeometry!: THREE.BoxGeometry;
  private fieldMaterial!: THREE.MeshNormalMaterial;
  private fieldGeometry2!: THREE.BoxGeometry;
  private fieldMaterial2!: THREE.MeshNormalMaterial;
  private field!: THREE.Mesh<THREE.BoxGeometry, THREE.MeshNormalMaterial>;

  constructor(canvas: HTMLCanvasElement) {
    // Experience シングルトンを取得
    this.experience = Experience.getInstance(canvas);
    this.scene = this.experience.scene;
    this.FIELD_WIDTH = this.experience.FIELD_WIDTH;
    this.FIELD_LENGTH = this.experience.FIELD_LENGTH;

    this.setField();
    this.setBackgroundParticles(); // 追加：背景のパーティクルをセット
  }

  private setField() {
    this.fieldGeometry = new THREE.BoxGeometry(
      this.FIELD_WIDTH,
      1500,
      this.FIELD_LENGTH,
      20,
      20,
      20
    );
    this.fieldMaterial = new THREE.MeshNormalMaterial({
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });

    this.field = new THREE.Mesh(this.fieldGeometry, this.fieldMaterial);
    this.field.position.set(0, -5, 0);
    console.log('Field created:', this.field.uuid);
    console.log('Field position:', this.field.position);

    this.scene.add(this.field);
    console.log('Field added to scene:', this.field);

    this.setBackgroundParticles();
  }

  private setBackgroundParticles(): void {
    const particleCount = 7000;
    const particlesGeometry = new THREE.BufferGeometry();
    this.particlePositions = new Float32Array(particleCount * 3);
    this.particleSpeeds = new Float32Array(particleCount * 3);

    // 広めの空間にランダムな座標を設定（例：-5000～+5000 の範囲）
    for (let i = 0; i < particleCount * 3; i++) {
      this.particlePositions[i] = (Math.random() - 0.5) * 10000;
      this.particleSpeeds[i] = (Math.random() - 0.5) * 0.1; // パーティクルの速度を設定
    }
    particlesGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.particlePositions, 3)
    );

    // PointsMaterial で星のようなパーティクルを作成
    const particlesMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 5,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });

    this.particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
    this.scene.add(this.particleSystem);
    console.log('Background particles added');
  }

  public updateParticles(): void {
    const positions = this.particleSystem.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] += this.particleSpeeds[i]; // x 方向に速度を適用
      positions[i + 1] += this.particleSpeeds[i + 1]; // y 方向に速度を適用
      positions[i + 2] += this.particleSpeeds[i + 2]; // z 方向に速度を適用

      if (positions[i] > 5000 || positions[i] < -5000) this.particleSpeeds[i] *= -1;
      if (positions[i + 1] > 5000 || positions[i + 1] < -5000) this.particleSpeeds[i + 1] *= -1;
      if (positions[i + 2] > 5000 || positions[i + 2] < -5000) this.particleSpeeds[i + 2] *= -1;
    }
    this.particleSystem.geometry.attributes.position.needsUpdate = true;
  }

  public update() {
    // 必要に応じて実装
  }
}
