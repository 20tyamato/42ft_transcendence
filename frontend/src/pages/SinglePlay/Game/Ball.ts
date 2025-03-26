import * as THREE from 'three';
import Experience from './Experience';

export default class Ball {
  private experience: Experience;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private BALL_RADIUS: number;
  private FIELD_LENGTH: number;

  public ballGeometry!: THREE.SphereGeometry;
  public ballMaterial!: THREE.MeshNormalMaterial;
  public ball!: THREE.Mesh<THREE.SphereGeometry, THREE.MeshNormalMaterial>;
  public mainLight!: THREE.HemisphereLight;

  constructor(canvas: HTMLCanvasElement) {
    this.experience = Experience.getInstance(canvas);

    this.scene = this.experience.scene;
    this.camera = this.experience.camera;
    this.BALL_RADIUS = this.experience.BALL_RADIUS;
    this.FIELD_LENGTH = this.experience.FIELD_LENGTH;

    this.setBall();
  }

  private setBall(): void {
    this.ballGeometry = new THREE.SphereGeometry(this.BALL_RADIUS, 12, 12);
    this.ballMaterial = new THREE.MeshNormalMaterial({
      wireframe: true,
      opacity: 1,
    });

    this.ball = new THREE.Mesh(this.ballGeometry, this.ballMaterial);

    console.log('Ball created:', this.ball.uuid);
    console.log('Ball initial position:', this.ball.position);

    this.scene.add(this.ball);

    this.camera.lookAt(this.ball.position);
    this.ball.position.set(0, 0, 0);
    console.log('Ball position after set:', this.ball.position);
  }

  public update(): void {
    this.ball.rotation.y += 0.001;
    this.ball.rotation.x += 0.001;
  }
}
