import Experience from './Experience';
import * as THREE from 'three';

export default class Walls {
  private experience: Experience;
  private scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  private FIELD_WIDTH: number;
  private FIELD_LENGTH: number;
  private wallGeometry: THREE.BoxGeometry;
  private wallMaterial: THREE.MeshNormalMaterial;
  private wallRight: THREE.Mesh;
  private wallLeft: THREE.Mesh;

  constructor(canvas: HTMLCanvasElement) {
    this.experience = Experience.getInstance(canvas);
    this.scene = this.experience.scene;
    this.camera = this.experience.camera;

    this.FIELD_WIDTH = this.experience.FIELD_WIDTH;
    this.FIELD_LENGTH = this.experience.FIELD_LENGTH;

    this.wallGeometry = new THREE.BoxGeometry(10, 20,this.experience.FIELD_LENGTH);
    this.wallMaterial = new THREE.MeshNormalMaterial({
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });

    this.wallRight = this.createWall(this.experience.FIELD_WIDTH / 2 + 5, 0, 0); // wallRight プロパティを初期化
    this.wallLeft = this.createWall(-this.experience.FIELD_WIDTH / 2 - 5, 0, 0); // wallLeft プロパティを初期化

    this.setWallsRight();
    this.setWallsLeft();
  }

  private createWall(x: number, y: number, z: number): THREE.Mesh {
    const wall = new THREE.Mesh(this.wallGeometry, this.wallMaterial);
    wall.position.set(x, y, z);
    this.scene.add(wall);
    return wall;
  }

  private setWallsRight(): void {
    this.wallRight.position.set(750, 0, 0);
  }

  private setWallsLeft(): void {
    this.wallLeft.position.set(-750, 0, 0);
  }

  public update(): void {}
}
