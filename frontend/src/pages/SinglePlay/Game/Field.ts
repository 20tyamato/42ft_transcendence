// Field.ts
import * as THREE from 'three';
import Experience from './Experience'; // 実際のパスに合わせてください

export default class Field {
  // --- クラスプロパティの型定義 ---
  private experience: Experience;
  private scene: THREE.Scene;
  private FIELD_WIDTH: number;
  private FIELD_LENGTH: number;

  private fieldGeometry!: THREE.BoxGeometry;
  private fieldMaterial!: THREE.MeshBasicMaterial;
  private field!: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>;

  constructor(private canvas: HTMLCanvasElement) {
    // Experience シングルトンを取得
    this.experience = Experience.getInstance(canvas);

    // Experience 内の scene, FIELD_WIDTH, FIELD_LENGTH などを利用
    this.scene = this.experience.scene;
    this.FIELD_WIDTH = this.experience.FIELD_WIDTH;
    this.FIELD_LENGTH = this.experience.FIELD_LENGTH;

    this.setField();
  }

  private setField() {
    // BoxGeometry(幅, 高さ, 奥行き, 幅方向の分割数, 高さ方向の分割数, 奥行き方向の分割数)
    this.fieldGeometry = new THREE.BoxGeometry(
      this.FIELD_WIDTH,
      1500,
      this.FIELD_LENGTH,
      50,
      50,
      50
    );

    // wireframe オプションで枠線表示のみなど
    this.fieldMaterial = new THREE.MeshBasicMaterial({
      color: 0x000aff,
      wireframe: true,
      transparent: true,
      opacity: 1.0,
    });

    this.field = new THREE.Mesh(this.fieldGeometry, this.fieldMaterial);
    this.field.position.set(0, -50, 0);

    // シーンに追加
    this.scene.add(this.field);
  }

  // 毎フレーム呼び出される更新メソッドが必要なら
  public update() {
    // 必要に応じて実装
  }
}
