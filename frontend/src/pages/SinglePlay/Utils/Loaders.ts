import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import EventEmitter from './EventEmitter';
import Source from './sources';

interface Source {
  name: string;
  type: 'gltfModel';
  path: string;
}

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

  private startLoading(): void {
    for (const source of this.sources) {
      if (source.type === 'gltfModel') {
        this.loaders.gltfLoader.load(source.path, (file) => this.sourceLoaded(source, file));
      }
    }
  }

  private sourceLoaded(source: Source, file: any): void {
    this.items[source.name] = file;
    this.loaded++;
    if (this.loaded === this.toLoad) {
      this.trigger('ready');
    }
  }
}
