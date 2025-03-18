// ArcadeMachine.ts
import * as THREE from 'three';

export default class ArcadeMachine {
  public machine: THREE.Mesh | null = null;
  public screenMesh: THREE.Mesh | null = null;

  constructor(
    private scene: THREE.Scene,
    private renderTargetTexture: THREE.Texture
  ) {
    // 平面ジオメトリの作成
    const geometry = new THREE.PlaneGeometry(1800, 1200);

    // TextureLoader を使用してテクスチャを読み込む
    const loader = new THREE.TextureLoader();
    loader.load(
      '/assets/pongmachine2.png',
      (texture) => {
        // 必要ならミップマップ生成を無効にする
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        const material = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: false,
          opacity: 1,
          alphaTest: 0,
          depthWrite: true,
          depthTest: true,
          side: THREE.FrontSide,
        });

        this.machine = new THREE.Mesh(geometry, material);
        this.machine.position.set(0, -130, 70);
        this.scene.add(this.machine);

        // スクリーン部分のジオメトリとマテリアルの作成
        const screenGeometry = new THREE.PlaneGeometry(600, 400);
        const screenMaterial = new THREE.MeshBasicMaterial({
          map: this.renderTargetTexture,
          transparent: false,
        });
        this.screenMesh = new THREE.Mesh(screenGeometry, screenMaterial);
        // スクリーンの位置調整（アセットに合わせて調整してください）
        this.screenMesh.position.set(0, -20, 1);
        this.machine.add(this.screenMesh);
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
