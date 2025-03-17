import i18next from '@/config/i18n';
import { Page } from '@/core/Page';
import AuthLayout from '@/layouts/AuthLayout';
import { fetchCurrentUser } from '@/models/User/repository';
import { setUserLanguage } from '@/utils/language';
import { updateText } from '@/utils/updateElements';
import ArcadeMachine from './ArcadeMachine';
import GameRenderer from './GameRenderer';
import * as THREE from 'three';

const updatePageContent = (): void => {
  updateText('title', i18next.t('home'));
};

const HomePage = new Page({
  name: 'Home',
  config: { layout: AuthLayout },
  mounted: async ({ pg, user }) => {
    setUserLanguage(user.language, updatePageContent);

    // HTML に <canvas id="gl"></canvas> が必要
    const canvas = document.getElementById('gl') as HTMLCanvasElement;
    if (!canvas) {
      console.error('Canvas element not found');
      return;
    }

    // レンダラーの作成
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // メインシーンの作成
    const scene = new THREE.Scene();

    // GameRenderer を作成し、スクリーンに表示するシーンをレンダリング
    const gameRenderer = new GameRenderer(renderer);

    // ArcadeMachine を作成：renderTarget.texture をスクリーンのテクスチャとして使用
    const arcadeMachine = new ArcadeMachine(scene, gameRenderer.renderTarget.texture);

    // カメラの作成（Welcome ページ全体を表示するためのカメラ）
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      5000
    );
    camera.position.set(0, 1000, 1500);
    camera.lookAt(0, 0, 0);

    function animate() {
      gameRenderer.update();
      // メインシーンをレンダリング
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    animate();

    // ユーザーデータやその他の UI の処理は省略…
    pg.logger.info('HomePage mounted!');
  },
});

export default HomePage;
