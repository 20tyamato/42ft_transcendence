// Field.ts
import * as THREE from 'three';
import Experience from './Experience';

export default class Field {
  // --- クラスプロパティの型定義 ---
  private experience: Experience;
  private scene: THREE.Scene;
  private FIELD_WIDTH: number;
  private FIELD_LENGTH: number;

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
  }

  private setField() {
    // BoxGeometry(幅, 高さ, 奥行き, 幅方向の分割数, 高さ方向の分割数, 奥行き方向の分割数)
    this.fieldGeometry = new THREE.BoxGeometry(
      this.FIELD_WIDTH,
      1500,
      this.FIELD_LENGTH,
      20,
      20,
      20
    );


    // // 卓球の平台のジオメトリを作成
    // this.fieldGeometry2 = new THREE.BoxGeometry(1500, 10, this.FIELD_LENGTH);

    // // ワイヤーフレームのマテリアルを作成
    // this.fieldMaterial2 = new THREE.MeshNormalMaterial({
    //   wireframe: true,
    //   transparent: true,
    //   opacity: 0.5,
    // });

    // this.fieldGeometry = new THREE.BoxGeometry(900, 10, 3000)
    this.fieldMaterial = new THREE.MeshNormalMaterial({
      // color: 0x000aff,
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
  }

  // 毎フレーム呼び出される更新メソッドが必要なら
  public update() {
    // 必要に応じて実装
  }
}
