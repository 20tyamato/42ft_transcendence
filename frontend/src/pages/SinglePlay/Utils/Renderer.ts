import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';
import Experience from '../Game/Experience';

export default class Renderer extends THREE.WebGLRenderer {
  static instance: Experience;
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
    this.camera = this.experience.camera as THREE.PerspectiveCamera;

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

  update(): void {
    this.composer.render();
  }
}
