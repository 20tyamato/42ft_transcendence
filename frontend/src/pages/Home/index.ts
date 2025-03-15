import i18next from '@/config/i18n';
import { Page } from '@/core/Page';
import AuthLayout from '@/layouts/AuthLayout';
import { isLoggedIn } from '@/libs/Auth/currnetUser';
import { updateLanguage } from '@/models/User/repository';
import { fetchCurrentUser } from '@/models/User/repository';
import { setUserLanguage } from '@/utils/language';
import { updateText } from '@/utils/updateElements';
import Background from './Background';
// import Stars from './Stars';
import * as THREE from 'three';

const registerStartButton = async (): Promise<void> => {
  const startBtn = document.querySelector('a[href="/login"]');
  startBtn?.addEventListener('click', async (event) => {
    event.preventDefault();
    if (await isLoggedIn()) {
      i18next.changeLanguage(i18next.language);
      updateLanguage(i18next.language);
      window.location.href = '/modes';
    } else {
      window.location.href = '/login';
    }
  });
};

const updatePageContent = (): void => {
  updateText('title', i18next.t('home'));
  // 他のテキスト更新...
};

const HomePage = new Page({
  name: 'Home',
  config: { layout: AuthLayout },
  mounted: async ({ pg, user }) => {
    setUserLanguage(user.language, updatePageContent);
    registerStartButton();

    // HTML に <canvas id="gl"></canvas> が存在する前提
    const canvas = document.getElementById('gl') as HTMLCanvasElement;
    if (!canvas) {
      console.error('Canvas element with id="gl" not found.');
      return;
    }

    // レンダラーの作成
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // カメラの作成（上空から平面を垂直に見る）
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      5000
    );
    camera.position.set(0, 1000, 0);
    camera.lookAt(0, 0, 0);

    // シーンを作成
    const scene = new THREE.Scene();

    // Background と Stars を生成（シーンに追加）
    const background = new Background(scene);
    // const stars = new Stars(scene);

    // アニメーションループ
    function animate() {
      background.update();
      // stars.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    animate();

    pg.logger.info('HomePage mounted!');
  },
});

export default HomePage;
