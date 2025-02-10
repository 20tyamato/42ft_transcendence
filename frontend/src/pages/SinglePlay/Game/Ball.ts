import * as THREE from 'three';
import Experience from './Experience';

export default class Ball {
  private experience: Experience;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private ball: THREE.Mesh;
  private ballGeometry: THREE.SphereGeometry;
  private ballMaterial: THREE.MeshBasicMaterial;
  private mainLight: THREE.HemisphereLight;
  private BALL_RADIUS: number;
  private FIELD_LENGTH: number;

  constructor(canvas: HTMLCanvasElement) {
    this.experience = new Experience(canvas);
    this.scene = this.experience.scene;
    this.camera = this.experience.camera;

    this.BALL_RADIUS = this.experience.BALL_RADIUS;
    this.FIELD_LENGTH = this.experience.FIELD_LENGTH;

    this.ballGeometry = new THREE.SphereGeometry(this.BALL_RADIUS, 12, 12);
    this.ballMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.1,
    });
    this.mainLight = new THREE.HemisphereLight(0xffffff, 0x003300);

    this.ball = this.createBall();
  }

  private createBall(): THREE.Mesh {
    const ball = new THREE.Mesh(this.ballGeometry, this.ballMaterial);
    this.scene.add(ball);
    this.scene.add(this.mainLight);
    return ball;
  }

  public getPosition(): THREE.Vector3 {
    return this.ball.position;
  }

  public update(): void {
    this.ball.rotation.y += 0.007;
    this.ball.rotation.x += 0.004;
  }
}
