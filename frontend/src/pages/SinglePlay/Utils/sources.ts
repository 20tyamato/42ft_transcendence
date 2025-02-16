export interface Source {
  name: string;
  type: 'gltfModel' | 'texture';
  path: string;
}

const sources: Source[] = [
  { name: 'scene', type: 'gltfModel', path: '/models/scene.glb' },
  { name: 'texture1', type: 'texture', path: '/textures/texture1.jpg' },
];

export default sources;
