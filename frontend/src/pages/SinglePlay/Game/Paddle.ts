import * as THREE from 'three';
import Experience from './Experience';

export default class Paddle {
  private experience: Experience;
  private scene: THREE.Scene;
  private PADDLE_WIDTH: number;
  private PADDLE_HEIGHT: number;
  private FIELD_LENGTH: number;
  private paddleGeometry: THREE.BoxGeometry;
  private paddleMaterial: THREE.MeshNormalMaterial;
  public paddleOne: THREE.Mesh;
  public paddleTwo: THREE.Mesh;

  constructor(canvas: HTMLCanvasElement) {
    this.experience = Experience.getInstance(canvas);
    this.scene = this.experience.scene;
    this.PADDLE_WIDTH = this.experience.PADDLE_WIDTH;
    this.PADDLE_HEIGHT = this.experience.PADDLE_HEIGHT;
    this.FIELD_LENGTH = this.experience.FIELD_LENGTH;

    this.paddleGeometry = new THREE.BoxGeometry(this.PADDLE_WIDTH, this.PADDLE_HEIGHT, 10);
    this.paddleMaterial = new THREE.MeshNormalMaterial({
      wireframe: true,
    });

    this.paddleOne = this.createPaddle();
    this.paddleTwo = this.createPaddle();

    this.setPaddlePositions();
  }

  private createPaddle(): THREE.Mesh {
    const paddle = new THREE.Mesh(this.paddleGeometry, this.paddleMaterial);
    this.scene.add(paddle);
    return paddle;
  }

  private setPaddlePositions(): void {
    this.paddleOne.position.set(0, 0, this.FIELD_LENGTH / 2 - 50);
    this.paddleTwo.position.set(0, 0, -this.FIELD_LENGTH / 2 + 50);
  }

  public update(): void {}
}
