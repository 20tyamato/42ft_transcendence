// ArcadeMachine.ts
import { logger } from '@/core/Logger';
import * as THREE from 'three';

export default class ArcadeMachine {
  public machine: THREE.Mesh | null = null;
  public screenMesh: THREE.Mesh | null = null;
  public group: THREE.Group = new THREE.Group();

  constructor(
    private scene: THREE.Scene,
    private renderTargetTexture: THREE.Texture
  ) {
    const geometry = new THREE.PlaneGeometry(1800, 1200);

    // TextureLoader
    const loader = new THREE.TextureLoader();
    loader.load(
      '/assets/pongmachine2.png',
      (texture) => {
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        const material = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          opacity: 1,
          depthWrite: true,
          depthTest: true,
          // side: THREE.FrontSide,
        });

        this.machine = new THREE.Mesh(geometry, material);
        this.machine.position.set(15, -150, 40);
        this.scene.add(this.machine);

        this.group = new THREE.Group();
        scene.add(this.group);
      },
      undefined,
      (error) => {
        logger.error('Error loading image:', error);
      }
    );
  }
  getGroup(): THREE.Group {
    return this.group;
  }

  update(): void {}
}
