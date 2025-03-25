// BallFactory.ts
import { logger } from '@/core/Logger';
import * as THREE from 'three';

/**
 * 指定された文字、背景色、テキスト色でキャンバステクスチャを生成する
 */
export function createBallTexture(
  text: string,
  backgroundColor: string = '#000000',
  textColor: string
): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, size, size);

    const fontSize = size * 0.3;
    ctx.font = `${fontSize}px Orbitron`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, size / 2, size / 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.center.set(0.5, 0.5);
  texture.rotation = 0;
  return texture;
}

/**
 * 指定されたパラメータで球体メッシュを生成する
 */
export function createBall(
  text: string,
  backgroundColor: string,
  textColor: string,
  radius: number
): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(radius, 32, 32);

  const normalMaterial = new THREE.MeshNormalMaterial();
  const textMaterial = new THREE.MeshBasicMaterial({
    map: createBallTexture(text, 'rgba(0,0,0,0)', '#ffffff'),
    transparent: true,
  });

  const normalBall = new THREE.Mesh(geometry, normalMaterial);
  const textBall = new THREE.Mesh(geometry, textMaterial);

  const group = new THREE.Group();
  group.add(normalBall);
  group.add(textBall);

  const wrapper = new THREE.Mesh();
  wrapper.add(group);
  group.rotation.y = 300;
  return wrapper;
}

export interface PhysicsBall {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  radius: number;
}

export class BallsGroup {
  private balls: PhysicsBall[] = [];
  private gravity = -7;
  private restitution = 1.0;
  private prevTime: number;
  private group: THREE.Group;

  constructor() {
    this.group = new THREE.Group();
    this.prevTime = performance.now();

    const radius = 40;
    const ball4 = createBall('4', '#ff0000', '#ffffff', radius);
    const ball2 = createBall('2', '#0000ff', '#ffffff', radius);

    const initialHeight = 180;

    // ボールの初期設定
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
      // 重力
      ball.velocity.y += this.gravity * dt * 50;
      // 速度に基づく位置更新
      const deltaY = ball.velocity.y * dt;
      ball.mesh.position.y += deltaY;
      logger.log(
        `Ball position: ${ball.mesh.position.y.toFixed(2)}, velocity: ${ball.velocity.y.toFixed(2)}`
      );
      // 床との衝突判定（より安定した判定）
      if (ball.mesh.position.y <= ball.radius) {
        ball.mesh.position.y = ball.radius;
        ball.velocity.y = -ball.velocity.y * this.restitution;
      }
    });
  }

  public getGroup(): THREE.Group {
    return this.group;
  }
}
