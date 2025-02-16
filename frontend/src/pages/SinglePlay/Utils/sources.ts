export type Source = {
  name: string;
  type: 'gltfModel' | 'texture' | 'cubeTexture';
  path: string;
};

const sources: Source[] = [
  {
    name: 'exampleModel',
    type: 'gltfModel',
    path: '/models/scene.glb',
  },
];
export default sources;
