import * as THREE from 'three';

export default class Ball {
  private ball: THREE.Mesh;
  private velocity: THREE.Vector3;

  constructor(scene: THREE.Scene, radius: number, position: THREE.Vector3, aiLevel: number) {
    const speed = aiLevel * 5; // AIレベルに応じた速度を設定
    this.velocity = new THREE.Vector3(speed, 0, -speed); // 初期速度をAIレベルに依存

    const ballGeometry = new THREE.SphereGeometry(radius, 32, 32);
    const ballMaterial = new THREE.MeshNormalMaterial({
      wireframe: true,
      // transparent: true,
      opacity: 0.8,
    });
    this.ball = new THREE.Mesh(ballGeometry, ballMaterial);
    this.ball.position.copy(position);
    scene.add(this.ball);
  }

  update(paddle1: THREE.Mesh, paddle2: THREE.Mesh) {
    // ボールの移動
    this.ball.position.add(this.velocity);

    // 壁での反射
    if (this.ball.position.x < -600 || this.ball.position.x > 600) {
      this.velocity.x *= -1;
    }

    // パドルでの反射
    if (this.checkPaddleCollision(paddle1) || this.checkPaddleCollision(paddle2)) {
      this.velocity.z *= -1;
      this.velocity.x += Math.random() * 2 - 1; // ランダム性を追加
    }
  }

  private checkPaddleCollision(paddle: THREE.Mesh): boolean {
    const paddleBounds = {
      xMin: paddle.position.x - 100,
      xMax: paddle.position.x + 100,
      zMin: paddle.position.z - 10,
      zMax: paddle.position.z + 10,
    };

    return (
      this.ball.position.x > paddleBounds.xMin &&
      this.ball.position.x < paddleBounds.xMax &&
      this.ball.position.z > paddleBounds.zMin &&
      this.ball.position.z < paddleBounds.zMax
    );
  }

  // ボールの位置を取得
  getPosition(): THREE.Vector3 {
    return this.ball.position.clone();
  }

  // ボールの位置を設定
  setPosition(position: THREE.Vector3) {
    this.ball.position.copy(position);
  }

  // ボールの速度をリセット
  resetVelocity() {
    this.velocity.set(5, 0, -10);
  }
}
