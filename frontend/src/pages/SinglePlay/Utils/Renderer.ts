import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';
import Experience from '../Game/Experience';

export default class Renderer {
  private static instance: THREE.WebGLRenderer | null = null;

  static getInstance(canvas: HTMLCanvasElement): THREE.WebGLRenderer {
    if (!Renderer.instance) {
      Renderer.instance = new THREE.WebGLRenderer({ canvas, antialias: true });
      Renderer.instance.setSize(window.innerWidth, window.innerHeight);
    }
    return Renderer.instance;
  }

  static dispose(): void {
    if (Renderer.instance) {
      Renderer.instance.dispose();
      Renderer.instance = null;
    }
  }

  private experience: Experience;
  private canvas: HTMLCanvasElement;
  private sizes: { width: number; height: number };
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  public instance: THREE.WebGLRenderer;
  private composer: EffectComposer;
  private bloomPass: UnrealBloomPass;
  private filmPass: FilmPass;

  constructor(canvas: HTMLCanvasElement) {
    this.experience = Experience.getInstance(canvas);
    this.canvas = this.experience.canvas;
    this.sizes = { width: window.innerWidth, height: window.innerHeight };
    this.scene = this.experience.scene;
    this.camera = this.experience.camera as unknown as THREE.PerspectiveCamera;

    this.instance = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
    });
    this.instance.setSize(window.innerWidth, window.innerHeight);

    this.instance.setSize(this.sizes.width, this.sizes.height);
    this.composer = new EffectComposer(this.instance);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    const resolution = new THREE.Vector2(this.sizes.width, this.sizes.height);
    this.bloomPass = new UnrealBloomPass(resolution, 1.5, 0.4, 0.85);
    this.composer.addPass(this.bloomPass);

    this.filmPass = new FilmPass(0.35, false);
    this.composer.addPass(this.filmPass);
  }

  public resize(): void {
    this.instance.setSize(window.innerWidth, window.innerHeight);
  }

  public setSize(width: number, height: number) {
    this.instance.setSize(width, height);
    this.instance.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  update(): void {
    this.composer.render();
  }
}
