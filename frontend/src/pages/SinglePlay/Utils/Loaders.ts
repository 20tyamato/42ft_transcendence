import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import EventEmitter from './EventEmitter';
import sources, { Source } from './sources';

// interface Source {
//   name: string;
//   type: 'gltfModel';
//   path: string;
// }

export default class Loaders extends EventEmitter {
  private sources: Source[];
  private items: { [key: string]: any } = {};
  private loaders: { gltfLoader: GLTFLoader };
  private toLoad: number;
  private loaded: number = 0;

  constructor(sources: Source[]) {
    super();
    this.sources = sources;
    this.toLoad = sources.length;
    this.loaders = { gltfLoader: new GLTFLoader() };
    this.startLoading();
  }
  private async checkGLBExists(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error('GLBファイルの存在チェックに失敗:', error);
      return false;
    }
  }

  private async startLoading(): Promise<void> {
    for (const source of this.sources) {
      if (source.type === 'gltfModel') {
        const modelUrl = `/models/${source.name}.glb`;

        const exists = await this.checkGLBExists(modelUrl);
        if (!exists) {
          console.error(`GLBモデルが見つかりません: ${modelUrl}`);
          continue;
        }

        this.loaders.gltfLoader.load(
          modelUrl,
          (gltf) => {
            console.log('GLTFモデルがロードされました:', gltf);
            this.sourceLoaded(source, gltf);
          },
          undefined,
          (error) => {
            console.error('GLTFモデルのロードエラー:', error);
          }
        );
      }
    }
  }

  // private startLoading(): void {
  //   for (const source of this.sources) {
  //     if (source.type === 'gltfModel') {
  //       // this.loaders.gltfLoader.load('/models/scene.gltf', (file) =>
  //       //   this.sourceLoaded(source, file)
  //       // );
  //     }
  //     this.loaders.gltfLoader.load(
  //       '/models/scene.glb',
  //       (gltf) => {
  //         console.log('GLTFモデルがロードされました:', gltf);
  //         this.sourceLoaded(source, gltf);
  //       },
  //       undefined,
  //       (error) => {
  //         console.error('GLTFモデルのロードエラー:', error);
  //       }
  //     );
  //   }
  // }

  private sourceLoaded(source: Source, file: any): void {
    console.log(`Loaded: ${source.name}`, file);
    this.items[source.name] = file;
    this.loaded++;
    if (this.loaded === this.toLoad) {
      this.trigger('ready');
    }
  }
}
