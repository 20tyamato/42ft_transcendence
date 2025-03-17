// ArcadeMachine.ts
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export default class ArcadeMachine {
  public machine: THREE.Mesh;
  public screenMesh: THREE.Mesh | null = null;

  constructor(
    private scene: THREE.Scene,
    private renderTargetTexture: THREE.Texture
  ) {
    // ここではシンプルに平面ジオメトリにPNGテクスチャを貼る例を示す
    const geometry = new THREE.PlaneGeometry(800, 600);
    const textureLoader = new THREE.TextureLoader();
    // マシンの画像（透明なスクリーン部分があるPNG）
    const machineTexture = textureLoader.load('/assets/pongmachine.png');
    // マシン全体のマテリアル
    const material = new THREE.MeshBasicMaterial({
      map: machineTexture,
      transparent: true,
    });
    this.machine = new THREE.Mesh(geometry, material);
    // マシンの配置調整（例: 中央に配置）
    this.machine.position.set(0, 0, 0);
    this.scene.add(this.machine);

    // ここで、スクリーン部分の位置・サイズを特定して新たに平面ジオメトリを作成し、レンダーテクスチャを貼る
    // ※以下の数値はアセットに合わせて調整してください
    const screenGeometry = new THREE.PlaneGeometry(600, 400);
    const screenMaterial = new THREE.MeshBasicMaterial({
      map: renderTargetTexture,
      transparent: true,
    });
    this.screenMesh = new THREE.Mesh(screenGeometry, screenMaterial);
    // スクリーンの位置調整：マシン画像内でスクリーン部分に配置
    this.screenMesh.position.set(0, -20, 0.1);
    // マシンの子オブジェクトとして追加することで、相対位置が保たれる
    this.machine.add(this.screenMesh);
  }
}
