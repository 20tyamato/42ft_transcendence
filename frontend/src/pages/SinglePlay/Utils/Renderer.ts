// Renderer.ts
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js'
import Experience from '../Game/Experience'
// Renderer.ts
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';
import Experience from '../Game/Experience';

export default class Renderer {
  static instance: Renderer | null = null
  //  シングルトンインスタンスを取得
  static getInstance(canvas: HTMLCanvasElement): Renderer {
  static instance: Renderer | null = null;
  //  シングルトンインスタンスを取得
  static getInstance(canvas: HTMLCanvasElement): Renderer {
    if (!Renderer.instance) {
      Renderer.instance = new Renderer(canvas)
      Renderer.instance = new Renderer(canvas);
    }
    return Renderer.instance
  }

  
  // インスタンスの破棄
  // インスタンスの破棄
  static dispose(): void {
    if (Renderer.instance) {
      Renderer.instance.dispose()
      Renderer.instance = null
    }
  }

  private experience: Experience
  private canvas: HTMLCanvasElement
  private sizes: { width: number; height: number }
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera

  // three.js のレンダラー実体
  public instance: THREE.WebGLRenderer

  // ポストプロセス関連
  private composer: EffectComposer
  private bloomPass: UnrealBloomPass
  private filmPass: FilmPass
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
    this.experience = Experience.getInstance(canvas)
    this.canvas = this.experience.canvas
    this.sizes = { width: window.innerWidth, height: window.innerHeight }
    this.scene = this.experience.scene
    this.camera = this.experience.camera as THREE.PerspectiveCamera

    // WebGLRenderer の初期化
    this.experience = Experience.getInstance(canvas);
    this.canvas = this.experience.canvas;
    this.sizes = { width: window.innerWidth, height: window.innerHeight };
    this.scene = this.experience.scene;
    this.camera = this.experience.camera;

    // WebGLRenderer の初期化
    this.instance = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
    })
    this.instance.setSize(this.sizes.width, this.sizes.height)
    // 例: 背景色を設定したい場合
    // this.instance.setClearColor(0x000000, 1.0)

    // EffectComposer のセットアップ
    this.composer = new EffectComposer(this.instance)
    this.composer.addPass(new RenderPass(this.scene, this.camera))
    });
    this.instance.setSize(this.sizes.width, this.sizes.height);
    // 例: 背景色を設定したい場合
    // this.instance.setClearColor(0x000000, 1.0)

    // EffectComposer のセットアップ
    this.composer = new EffectComposer(this.instance);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    const resolution = new THREE.Vector2(this.sizes.width, this.sizes.height)
    this.bloomPass = new UnrealBloomPass(resolution, 1.5, 0.4, 0.85)
    this.composer.addPass(this.bloomPass)

    this.filmPass = new FilmPass(0.35, false)
    this.composer.addPass(this.filmPass)
  }

  public resize(): void {
    this.instance.setSize(window.innerWidth, window.innerHeight)
  }

  public setSize(width: number, height: number): void {
    this.instance.setSize(width, height)
    this.instance.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  public setSize(width: number, height: number): void {
    this.instance.setSize(width, height);
    this.instance.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  /**
   * 毎フレーム呼び出されるメソッド
   */
  public update(): void {
    // ポストプロセスを含む描画処理
    this.composer.render();
  /**
   * 毎フレーム呼び出されるメソッド
   */
  public update(): void {
    // ポストプロセスを含む描画処理
    this.composer.render()
  }

  /**
   * WebGLRenderer等のリソース破棄
   */
  public dispose(): void {
    this.instance.dispose()
    // composerやPassの破棄が必要なら追加処理を行う
    // e.g.) this.composer.dispose()
  }

  /**
   * WebGLRenderer等のリソース破棄
   */
  public dispose(): void {
    this.instance.dispose();
    // composerやPassの破棄が必要なら追加処理を行う
    // e.g.) this.composer.dispose()
  }
}
