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
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    this.FIELD_WIDTH = this.experience.FIELD_WIDTH;
    this.FIELD_LENGTH = this.experience.FIELD_LENGTH;

    this.wallGeometry = new THREE.BoxGeometry(10, 10, 3800, 5, 5, 500);
    this.wallMaterial = new THREE.MeshNormalMaterial({
      wireframe: true,
      transparent: true,
      opacity: 0.0,
    });

    this.wallRight = this.createWall(450, 0, -550); // wallRight プロパティを初期化
    this.wallLeft = this.createWall(-450, 0, -550); // wallLeft プロパティを初期化

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
    this.wallRight.position.set(450, 0, -550);
  }

  private setWallsLeft(): void {
    this.wallLeft.position.set(-450, 0, -550);
  }

  public update(): void {}
}


