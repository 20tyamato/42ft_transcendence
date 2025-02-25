import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Experience from '../Game/Experience';
import Renderer from '../Utils/Renderer';

export default class Camera {
  private experience: Experience;
  private renderer: Renderer;
  private scene: THREE.Scene;
  private canvas: HTMLCanvasElement;
  public instance: THREE.PerspectiveCamera;
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
    this.renderer = Renderer.getInstance(canvas);
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
    console.log('Camera position:', this.instance.position);
    console.log('Camera lookAt target:', this.controls.target); // OrbitControlsを使っているなら

  }
  private createCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(this.VIEW_ANGLE, this.ASPECT, this.NEAR, this.FAR);
    camera.position.set(0, -500, this.FIELD_LENGTH-100);
    this.scene.add(camera);
    return camera;
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
