import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Experience from '../Game/Experience';

export default class Camera {
  private experience: Experience;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private canvas: HTMLCanvasElement;
  private instance: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private WIDTH: number;
  private HEIGHT: number;
  private VIEW_ANGLE: number;
  private ASPECT: number;
  private NEAR: number;
  private FAR: number;
  private FIELD_LENGTH: number;

  constructor(canvas: HTMLCanvasElement) {
    this.experience = Experience.getInstance(canvas); // 先に割り当てる
    this.renderer = new THREE.WebGLRenderer({ canvas });
    this.scene = this.experience.scene;
    this.canvas = this.experience.canvas;

    this.WIDTH = window.innerWidth;
    this.HEIGHT = window.innerHeight;
    this.VIEW_ANGLE = 75;
    this.ASPECT = this.WIDTH / this.HEIGHT;
    this.NEAR = 0.1;
    this.FAR = 1000;
    this.FIELD_LENGTH = 3000;

    this.instance = this.createCamera();
    this.controls = this.createControls();
    this.addResizeListener();
  }
  private createCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.Camera();
    camera.position.set(0, 200, this.FIELD_LENGTH / 2 + 1000);
    this.scene.add(camera);
  }

  private createControls(): OrbitControls {
    const controls = new OrbitControls(this.instance, this.canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;
    return controls;
  }

  private addResizeListener(): void {
    window.addEventListener('resize', () => {
      this.WIDTH = window.innerWidth;
      this.HEIGHT = window.innerHeight;
      this.ASPECT = this.WIDTH / this.HEIGHT;

      this.instance.aspect = this.ASPECT;
      this.instance.updateProjectionMatrix();

      this.experience.renderer.setSize(this.WIDTH, this.HEIGHT);
    });
  }

  public resize(): void {
    this.instance.aspect = window.innerWidth / window.innerHeight;
    this.instance.updateProjectionMatrix();
  }

  public update(): void {
    this.controls.update();
  }
}
