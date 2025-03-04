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
    console.log('Field position:', this.field.position);

    this.scene.add(this.field);
    console.log('Field added to scene:', this.field);

    // this.setBackgroundParticles();
  }

  private setBackgroundParticles(): void {
    const particleCount = 7000;
    const particlesGeometry = new THREE.BufferGeometry();
    this.particlePositions = new Float32Array(particleCount * 3);
    this.particleSpeeds = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const index = i * 3;
      // 広めの空間にランダムな座標を設定（-5000～+5000）
      this.particlePositions[index] = (Math.random() - 0.5) * 10000;
      this.particlePositions[index + 1] = (Math.random() - 0.5) * 10000;
      this.particlePositions[index + 2] = (Math.random() - 0.5) * 10000;
      // 速度（各軸ランダム、初期速度は 0.1）
      this.particleSpeeds[index] = (Math.random() - 0.5) * 0.1;
      this.particleSpeeds[index + 1] = (Math.random() - 0.5) * 0.1;
      this.particleSpeeds[index + 2] = (Math.random() - 0.5) * 0.1;
    }

    particlesGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.particlePositions, 3)
    );

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
  } // Add your particle update logic here

  /**
   * updateParticles: パーティクルシステムの各パラメータを更新する
   * params の内容で色、サイズ、速度、密度、透明度をリアルタイム更新する
   */
  public updateParticles(params: {
    color: string;
    size: number;
    speed: number;
    density: number;
    opacity: number;
  }): void {
    const particlesMaterial = this.particleSystem.material as THREE.PointsMaterial;
    particlesMaterial.color.set(params.color);
    particlesMaterial.size = params.size;
    particlesMaterial.opacity = params.opacity;

    // 速度配列を再生成（ランダムな速度を params.speed に基づいて設定）
    for (let i = 0; i < this.particleSpeeds.length; i++) {
      this.particleSpeeds[i] = (Math.random() - 0.5) * params.speed;
    }

    // 密度が変更された場合、現在の粒子数と新密度を比較し再初期化する
    const currentDensity = this.particlePositions.length / 3;
    if (currentDensity !== params.density) {
      // 古いパーティクルシステムをシーンから削除
      this.scene.remove(this.particleSystem);
      // 新しい密度でパーティクルを初期化
      const particleCount = params.density;
      this.particlePositions = new Float32Array(particleCount * 3);
      this.particleSpeeds = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i++) {
        const index = i * 3;
        this.particlePositions[index] = (Math.random() - 0.5) * 10000;
        this.particlePositions[index + 1] = (Math.random() - 0.5) * 10000;
        this.particlePositions[index + 2] = (Math.random() - 0.5) * 10000;
        this.particleSpeeds[index] = (Math.random() - 0.5) * params.speed;
        this.particleSpeeds[index + 1] = (Math.random() - 0.5) * params.speed;
        this.particleSpeeds[index + 2] = (Math.random() - 0.5) * params.speed;
      }
      const newGeometry = new THREE.BufferGeometry();
      newGeometry.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));
      // 再利用するマテリアルはそのまま使う
      this.particleSystem = new THREE.Points(newGeometry, particlesMaterial);
      this.scene.add(this.particleSystem);
    } else {
      // 密度は同じなので、位置属性の更新をマーク
      (this.particleSystem.geometry.attributes.position as THREE.BufferAttribute).needsUpdate =
        true;
    }
  }

  public update(): void {
    // 必要に応じてパーティクルを動かすなどの処理
    const positions = (this.particleSystem.geometry.attributes.position as THREE.BufferAttribute)
      .array as Float32Array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] += this.particleSpeeds[i];
      positions[i + 1] += this.particleSpeeds[i + 1];
      positions[i + 2] += this.particleSpeeds[i + 2];
      if (positions[i] > 5000 || positions[i] < -5000) this.particleSpeeds[i] *= -1;
      if (positions[i + 1] > 5000 || positions[i + 1] < -5000) this.particleSpeeds[i + 1] *= -1;
      if (positions[i + 2] > 5000 || positions[i + 2] < -5000) this.particleSpeeds[i + 2] *= -1;
    }
    (this.particleSystem.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }
}
