export type Source = {
  name: string;
  type: 'gltfModel' | 'texture' | 'cubeTexture'; // すべてのタイプを受け付けるようにする
  path: string;
};

const sources: Source[] = [
  {
    name: 'exampleModel',
    type: 'gltfModel',
    path: '/models/example.glb',
  },
  {
    name: 'exampleTexture',
    type: 'texture',
    path: '/textures/example.jpg',
  },
];

export default sources;
