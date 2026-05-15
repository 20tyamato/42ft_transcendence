// frontend/src/pages/MultiPlay/index.ts
import i18next from '@/config/i18n';
import { Page } from '@/core/Page';
import Background3D from '@/components/Background3D';
import AuthLayout from '@/layouts/AuthLayout';
import { setUserLanguage } from '@/utils/language';
import { updateText } from '@/utils/updateElements';
import * as THREE from 'three';

const updatePageContent = (): void => {
  updateText('title', i18next.t('multiplay.pageTitle'));
  updateText('h1', i18next.t('multiplay.heading'));
  updateText('#start-matchmaking', i18next.t('multiplay.startMatchmaking'));
};

const MultiPlayPage = new Page({
  name: 'MultiPlay',
  config: { layout: AuthLayout },
  mounted: async ({ pg, user }): Promise<void> => {
    // Three.js 3D背景の初期化
    const canvas = document.getElementById('gl') as HTMLCanvasElement | null;
    if (canvas) {
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      camera.position.z = 1000;

      const background = new Background3D(scene);

      let animFrameId: number;
      const animate = () => {
        animFrameId = requestAnimationFrame(animate);
        background.update();
        renderer.render(scene, camera);
      };
      animate();

      const onResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener('resize', onResize);

      // SPA ルーター切替時にアニメーションを停止
      const observer = new MutationObserver(() => {
        if (!document.contains(canvas)) {
          cancelAnimationFrame(animFrameId);
          renderer.dispose();
          window.removeEventListener('resize', onResize);
          observer.disconnect();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    setUserLanguage(user.language, updatePageContent);
    document.getElementById('start-matchmaking')?.addEventListener('click', () => {
      window.location.href = '/multiplay/waiting';
    });
    pg.logger.info('MultiPlay page mounted');
  },
});

export default MultiPlayPage;
