import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default class Experience {
  public canvas: HTMLCanvasElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public controls: OrbitControls;
  public sizes: { width: number; height: number };
  public time: THREE.Clock;
  public field: THREE.Mesh;
  public ball: THREE.Mesh;
  public ballMaterial: THREE.Material;
  public paddleTwo: THREE.Mesh;
  public paddleOne: THREE.Mesh;
  public WIDTH: number;
  public HEIGHT: number;
  public VIEW_ANGLE: number;
  private animationFrameId: number | null = null;

  public FIELD_WIDTH: number = 1200;
  public FIELD_LENGTH: number = 3000;
  public PADDLE_WIDTH: number = 200;
  public PADDLE_HEIGHT: number = 30;
  public BALL_RADIUS: number = 20;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.time = new THREE.Clock();
    this.sizes = { width: window.innerWidth, height: window.innerHeight };
    this.WIDTH = window.innerWidth;
    this.HEIGHT = window.innerHeight;
    this.VIEW_ANGLE = 75;

    this.camera = this.createCamera();
    this.renderer = this.createRenderer();
    this.controls = this.createControls();
    this.createLighting();

    this.startRenderingLoop();
  }

  private createCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      this.VIEW_ANGLE,
      this.WIDTH / this.HEIGHT,
      0.1,
      10000
    );
    camera.position.set(0, 200, this.FIELD_LENGTH / 2 + 1000);
    this.scene.add(camera);
    return camera;
  }

  private createRenderer(): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    renderer.setSize(this.WIDTH, this.HEIGHT);
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
