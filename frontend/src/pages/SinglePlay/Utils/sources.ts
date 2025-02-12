export type Source = {
  name: string;
  type: 'gltfModel'; // 型を固定
  path: string;
};

export const sources: Source[] = [{ name: 'model', type: 'gltfModel', path: '/model/scene.gltf' }];
