// Ball.ts
import * as THREE from 'three'
import Experience from './Experience'  // 実際のパスに合わせて修正してください

export default class Ball {
  private experience: Experience
  private scene: THREE.Scene
  private camera: THREE.Camera
  private BALL_RADIUS: number
  private FIELD_LENGTH: number

  private ballGeometry!: THREE.SphereGeometry
  private ballMaterial!: THREE.MeshBasicMaterial
  private ball!: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>
  private mainLight!: THREE.HemisphereLight

  constructor(canvas: HTMLCanvasElement) {
    // Experienceのインスタンスを取得
    this.experience = Experience.getInstance(canvas)

    // Experience内のscene, camera, BALL_RADIUS, FIELD_LENGTHを参照
    this.scene = this.experience.scene
    this.camera = this.experience.camera // camera.instance など設計に合わせて
    this.BALL_RADIUS = this.experience.BALL_RADIUS
    this.FIELD_LENGTH = this.experience.FIELD_LENGTH

    // ボール生成
    this.setBall()
  }

  private setBall(): void {
    this.ballGeometry = new THREE.SphereGeometry(this.BALL_RADIUS, 12, 12)
    this.ballMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.1,
    })

    this.ball = new THREE.Mesh(this.ballGeometry, this.ballMaterial)

    // 簡易ライトを追加 (HemisphereLight)
    this.mainLight = new THREE.HemisphereLight(0xffffff, 0x003300)
    this.scene.add(this.mainLight)

    // シーンにボールを追加
    this.scene.add(this.ball)

    // カメラがボールを向く
    this.camera.lookAt(this.ball.position)

    // ボールの初期座標をセット
    this.ball.position.set(0, 290, this.FIELD_LENGTH / 2 - 80)
  }

  public update(): void {
    // 回転させるなどのアニメーション
    this.ball.rotation.y += 0.007
    this.ball.rotation.x += 0.004
  }
}
