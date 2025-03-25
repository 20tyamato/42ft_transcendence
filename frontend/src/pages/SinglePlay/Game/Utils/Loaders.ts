import { logger } from '@/core/Logger';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import EventEmitter from './EventEmitter';
import { Source } from './sources';

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
      logger.error('Failed to check the existence of GLB file:', error);
      return false;
    }
  }

  private async startLoading(): Promise<void> {
    for (const source of this.sources) {
      if (source.type === 'gltfModel') {
        const modelUrl = `/models/${source.name}.glb`;

        const exists = await this.checkGLBExists(modelUrl);
        if (!exists) {
          logger.error(`GLB model not found: ${modelUrl}`);
          continue;
        }

        this.loaders.gltfLoader.load(
          modelUrl,
          (gltf) => {
            logger.log('GLTF model loaded:', gltf);
            this.sourceLoaded(source, gltf);
          },
          undefined,
          (error) => {
            logger.error('Error loading GLTF model:', error);
          }
        );
      }
      this.loaders.gltfLoader.load(
        '/models/scene.glb',
        (gltf) => {
          logger.log('GLTF model loaded:', gltf);
          this.sourceLoaded(source, gltf);
        },
        undefined,
        (error) => {
          logger.error('Error loading GLTF model:', error);
        }
      );
    }
  }

  private sourceLoaded(source: Source, file: any): void {
    logger.log(`Loaded: ${source.name}`, file);
    this.items[source.name] = file;
    this.loaded++;
    if (this.loaded === this.toLoad) {
      this.trigger('ready');
    }
  }
}
