// ArcadeMachine.ts
import * as THREE from 'three';

export default class ArcadeMachine {
  public machine: THREE.Mesh | null = null;
  public screenMesh: THREE.Mesh | null = null;

  constructor(
    private scene: THREE.Scene,
    private renderTargetTexture: THREE.Texture
  ) {
    // 平面ジオメトリを作成
    const geometry = new THREE.PlaneGeometry(800, 600);
    // TextureLoader を使ってテクスチャを読み込む
    const loader = new THREE.TextureLoader();
    loader.load(
      '/assets/pongmachine.png',
      (texture) => {
        console.log('Image loaded successfully');
        // 読み込んだテクスチャをマテリアルに設定
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
        });
        // マシンのメッシュを生成し、シーンに追加
        this.machine = new THREE.Mesh(geometry, material);
        this.machine.position.set(0, 0, 0);
        this.scene.add(this.machine);
        console.log('Machine added to scene:', this.machine);
        // スクリーン部分のジオメトリとマテリアルの生成
        const screenGeometry = new THREE.PlaneGeometry(600, 400);
        const screenMaterial = new THREE.MeshBasicMaterial({
          map: this.renderTargetTexture,
          transparent: false,
        });
        this.screenMesh = new THREE.Mesh(screenGeometry, screenMaterial);
        this.screenMesh.position.set(0, -20, 0.1);
        this.machine.add(this.screenMesh);
        this.machine.renderOrder = 1;
      },
      undefined,
      (error) => {
        console.error('Error loading image:', error);
      }
    );
  }

  update(): void {
    // 必要ならアニメーション処理を追加
  }
}
