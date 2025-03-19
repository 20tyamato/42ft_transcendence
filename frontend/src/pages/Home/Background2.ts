import * as THREE from 'three';
import { createBall } from './BallFactory';

export interface PhysicsBall {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  radius: number;
}

export default class Background2 {
  private scene: THREE.Scene;
  private clock: THREE.Clock;
  private group: THREE.Group;
  private balls: PhysicsBall[] = [];
  private gravity = -7;
  private restitution = 1.0;
  private prevTime: number = 0;
  private plane: THREE.Mesh | null = null;

  constructor(scene: THREE.Scene, yPosition: number = -50) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.clock = new THREE.Clock();

    this.createBackground();
    this.createBalls();
  }

  private createBackground() {
    const geometry = new THREE.PlaneGeometry(300, 200, 128, 128);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    this.plane = new THREE.Mesh(geometry, material);
    this.plane.rotation.x = -Math.PI / 2;
    this.plane.position.y = -50;
    this.group.add(this.plane);
  }

  private createBalls() {
    const radius = 40;
    const ball4 = createBall('4', '#ff0000', '#ffffff', radius);
    const ball2 = createBall('2', '#0000ff', '#ffffff', radius);

    const initialHeight = 180;

    this.balls = [
      {
        mesh: ball4,
        velocity: new THREE.Vector3(0, 8, 0),
        radius: radius,
      },
      {
        mesh: ball2,
        velocity: new THREE.Vector3(0, 6, 0),
        radius: radius,
      },
    ];

    const offset = radius * 2;
    ball4.position.set(-offset, initialHeight, 50);
    ball2.position.set(offset, initialHeight, 50);

    this.balls.forEach((ball) => this.group.add(ball.mesh));
  }

  public update(): void {
    const currentTime = performance.now();
    const dt = (currentTime - this.prevTime) / 1000;
    this.prevTime = currentTime;

    this.balls.forEach((ball) => {
      ball.velocity.y += this.gravity * dt * 50;
      ball.mesh.position.y += ball.velocity.y * dt;

      if (ball.mesh.position.y <= ball.radius) {
        ball.mesh.position.y = ball.radius;
        ball.velocity.y = -ball.velocity.y * this.restitution;
      }
    });

    const time = this.clock.getElapsedTime();
    if (!this.plane) return;
    const positions = this.plane.geometry.attributes.position.array;
    const amplitude = 20;
    const frequency = 0.005;
    const phase = time * 0.5;

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      positions[i + 2] =
        Math.sin(x * frequency + phase) * amplitude +
        Math.cos(y * frequency + phase) * amplitude * 0.5;
    }

    this.plane.geometry.attributes.position.needsUpdate = true;
    this.plane.geometry.computeVertexNormals();
  }

  getGroup(): THREE.Group {
    return this.group;
  }
}
