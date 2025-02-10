import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import Sizes from '../Utils/Sizez';
import Time from '../Utils/Time';
import Camera from '../World/Camera';
import Renderer from '../Utils/Renderer';
import World from '../World/World';
import Loaders from '../Utils/Loaders';
import CameraLerp from '../World/CameraLerp';
import sources from '../Utils/sources';
import Field from './Field';
import Paddle from './Paddle';
import Ball from './Ball';
import Walls from './Wall';
import LocalGame from '../Game/LocalGame';

export default class Experience {
  public canvas: HTMLCanvasElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public controls: OrbitControls;
  private clock: THREE.Clock;
  private animationFrameId: number | null = null;

  public FIELD_WIDTH: number = 1200;
  public FIELD_LENGTH: number = 3000;
  public PADDLE_WIDTH: number = 200;
  public PADDLE_HEIGHT: number = 30;
  public BALL_RADIUS: number = 20;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();

    this.camera = this.createCamera(); // カメラの初期化
    this.renderer = this.createRenderer(); // レンダラーの初期化
    this.controls = this.createControls(); // コントロールの初期化
    this.createLighting();

    this.startRenderingLoop();
  }

  private createCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      10000
    );
    camera.position.set(0, 200, this.FIELD_LENGTH / 2 + 1000);
    this.scene.add(camera);
    return camera;
  }

  private createRenderer(): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    return renderer;
  }

  private createControls(): OrbitControls {
    const controls = new OrbitControls(this.camera, this.canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;
    return controls;
  }

  private createLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 2);
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1.5);
    pointLight.position.set(0, 500, 0);
    this.scene.add(pointLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(0, 1, 1).normalize();
    this.scene.add(directionalLight);

    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
    hemisphereLight.position.set(0, 200, 0);
    this.scene.add(hemisphereLight);
  }

  private startRenderingLoop(): void {
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);
      this.update();
      this.render();
    };
    animate();
  }

  public update(): void {
    this.controls.update();
  }

  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  public stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public destroy(): void {
    this.stop();
    this.controls.dispose();
    this.renderer.dispose();
    this.scene.clear();
  }
}
