import Experience from './Experience';
import * as THREE from 'three';
// import Camera from '../World/Camera';

export default class Walls {
  public experience: Experience;
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private FIELD_WIDTH: number;
  private FIELD_LENGTH: number;
  private wallGeometry: THREE.BoxGeometry;
  private wallMaterial: THREE.MeshBasicMaterial;
  private wallRight: THREE.Mesh;
  private wallLeft: THREE.Mesh;

  constructor(canvas: HTMLCanvasElement) {
    this.experience = Experience.getInstance(canvas);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.FIELD_WIDTH = 900;
    this.FIELD_LENGTH = 3000;

    this.wallGeometry = new THREE.BoxGeometry(10, 10, 3800, 5, 5, 500);
    this.wallMaterial = new THREE.MeshBasicMaterial({
      color: 0x1f44ff,
      wireframe: true,
      transparent: true,
      opacity: 0.0,
    });

    this.wallLeft = this.createWall(-450, 0, -550);
    this.wallRight = this.createWall(450, 0, -550);

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
    this.wallRight = new THREE.Mesh(this.wallGeometry, this.wallMaterial);
    this.wallRight.position.set(450, 0, -550);
    this.scene.add(this.wallRight);
  }

  private setWallsLeft(): void {
    this.wallLeft = new THREE.Mesh(this.wallGeometry, this.wallMaterial);
    this.wallLeft.position.set(-450, 0, -550);
    this.scene.add(this.wallLeft);
  }

  public update(): void {}
}
