import * as THREE from 'three';
import Sizes from './Utils/Sizez';
import Time from './Utils/Time';
import Camera from './World/Camera';
import Renderer from './Utils/Renderer';
import World from './World/World';
import Loaders from './Utils/Loaders';
import sources from './Utils/sources';
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
  public VIEW_ANGLE: number = 75;
  public ASPECT: number = window.innerWidth / window.innerHeight;
  public NEAR: number = 0.1;
  public FAR: number = 5000;
  public FIELD_WIDTH: number = 1500;
  public FIELD_LENGTH: number = 2600;
  public BALL_RADIUS: number = 20;
  public PADDLE_WIDTH: number = 150;
  public PADDLE_HEIGHT: number = 30;

  public canvas!: HTMLCanvasElement;
  public sizes!: Sizes;
  public time: Time = new Time();
  public scene: THREE.Scene = new THREE.Scene();
  public resources: Loaders;
  public camera = new THREE.PerspectiveCamera();
  public cameraClass: Camera;
  public renderer!: Renderer;
  public world!: World;

  public field!: Field;
  public paddle!: Paddle;
  public ball!: Ball;
  public walls!: Walls;
  public localGame!: LocalGame;

  private localGameStarted: boolean = false;

  private constructor(canvas: HTMLCanvasElement) {
    Experience.instance = this;
    window.experience = this;
    window.incorrectDevice = false;

    this.canvas = canvas;
    this.sizes = new Sizes();
    this.time = new Time();
    this.scene = new THREE.Scene();
    this.resources = new Loaders(sources);
    this.cameraClass = new Camera(canvas); // クラスインスタンスを保持
    this.camera = this.cameraClass.instance; // ここで camera の実体を登録
    this.initializeRenderer(canvas);
    this.world = new World(canvas);
    this.renderer = Renderer.getInstance(canvas);

    this.field = new Field(canvas);
    this.paddle = new Paddle(canvas);
    this.ball = new Ball(canvas);
    this.walls = new Walls(canvas);
    this.localGame = new LocalGame(canvas);
    this.localGameStarted = true;
    this.sizes.on('resize', () => this.resize());
    this.resize();
  }

  static getInstance(canvas: HTMLCanvasElement): Experience {
    if (!Experience.instance) {
      Experience.instance = new Experience(canvas);
    }
    return Experience.instance;
  }

  private resize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.sizes.width, this.sizes.height);
  }

  public update(): void {
    this.world.update();
    this.ball.update();
    this.field.update();
    this.paddle.update();
    if (this.localGameStarted) {
      this.localGame.update();
    }
    this.cameraClass.update();
    this.renderer.update();
    // requestAnimationFrame(() => this.update());
    console.log("Experience update running");
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
  public initializeRenderer(canvas: HTMLCanvasElement): void {
    this.renderer = new Renderer(canvas);
  }
}
