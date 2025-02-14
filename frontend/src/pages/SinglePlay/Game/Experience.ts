import * as THREE from 'three';
import Sizes from '../Utils/Sizez';
import Time from '../Utils/Time';
import Camera from '../World/Camera';
import Renderer from '../Utils/Renderer';
import World from '../World/World';
import Loaders from '../Utils/Loaders';
import CameraLerp from '../World/CameraLerp';
import sources from '../Utils/sources';
import Field from '../Game/Field';
import Paddle from '../Game/Paddle';
import Ball from '../Game/Ball';
import Walls from '../Game/Wall';
import LocalGame from '../Game/LocalGame';

// Window 型拡張
declare global {
  interface Window {
    experience?: Experience;
    incorrectDevice?: boolean;
  }
}

export default class Experience {
  private static instance: Experience | null = null;

  public WIDTH: number = window.innerWidth;
  public HEIGHT: number = window.innerHeight;
  public VIEW_ANGLE: number = 45;
  public ASPECT: number = this.WIDTH / this.HEIGHT;
  public NEAR: number = 0.1;
  public FAR: number = 10000;
  public FIELD_WIDTH: number = 900;
  public FIELD_LENGTH: number = 3000;
  public BALL_RADIUS: number = 20;
  public PADDLE_WIDTH: number = 200;
  public PADDLE_HEIGHT: number = 30;

  public canvas!: HTMLCanvasElement;
  public sizes!: Sizes;
  public time: Time = new Time();
  public scene: THREE.Scene = new THREE.Scene();
  public resources: Loaders = new Loaders(sources);
  public camera: Camera = new Camera(this.canvas);
  public renderer: THREE.WebGLRenderer = new Renderer(this.canvas);
  public world: World = new World(this.canvas);
  public cameraLerp: CameraLerp = new CameraLerp(this.canvas);

  public field: Field = new Field(this.canvas);
  public paddle: Paddle = new Paddle(this.canvas);
  public ball: Ball = new Ball(this.canvas);
  public walls: Walls = new Walls(this.canvas);
  public localGame: LocalGame = new LocalGame(this.canvas);

  private localGameStarted: boolean = false;

  private constructor(canvas: HTMLCanvasElement) {
    if (Experience.instance) {
      return Experience.instance;
    }

    Experience.instance = this;
    window.experience = this;
    window.incorrectDevice = false;

    this.canvas = canvas;
    this.sizes = new Sizes();
    this.time = new Time();
    this.scene = new THREE.Scene();
    this.resources = new Loaders(sources);
    this.camera = new Camera(canvas);
    this.renderer = new Renderer(canvas);
    this.world = new World(canvas);
    this.cameraLerp = new CameraLerp(canvas);

    this.field = new Field(canvas);
    this.paddle = new Paddle(canvas);
    this.ball = new Ball(canvas);
    this.walls = new Walls(canvas);
    this.localGame = new LocalGame(canvas);

    this.sizes.on('resize', () => this.resize());
    this.time.on('tick', () => this.update());
  }

  static getInstance(canvas: HTMLCanvasElement): Experience {
    if (!Experience.instance) {
      Experience.instance = new Experience(canvas);
    }
    return Experience.instance;
  }

  private resize(): void {
    this.camera.resize();
    this.renderer.setSize(this.sizes.width, this.sizes.height);
  }

  public update(): void {
    this.camera.update();
    this.world.update();
    // this.renderer.update(); // Removed because WebGLRenderer does not have an update method
    this.cameraLerp.update();
    this.ball.update();
    this.field.update();
    this.paddle.update();
    if (this.localGameStarted) {
      this.localGame.update();
    }
  }

  public destroy(): void {
    this.sizes.off('resize');
    this.time.off('tick');

    this.scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((material) => material.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }
}
