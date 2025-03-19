import i18next from '@/config/i18n';
import { Page } from '@/core/Page';
import AuthLayout from '@/layouts/AuthLayout';
import { setUserLanguage } from '@/utils/language';
import { updateText } from '@/utils/updateElements';
import ArcadeMachine from './ArcadeMachine';
import Background from './Background';
import Background2 from './Background2';
import * as THREE from 'three';

const updatePageContent = (): void => {
  updateText('title', i18next.t('home'));
};

const HomePage = new Page({
  name: 'Home',
  config: { layout: AuthLayout },
  mounted: async ({ pg, user }) => {
    setUserLanguage(user.language, updatePageContent);

    const canvas = document.getElementById('gl') as HTMLCanvasElement;
    if (!canvas) {
      console.error('Canvas element not found');
      return;
    }

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      5000
    );
    camera.position.set(0, 0, 1000);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const mainScene = new THREE.Scene();

    const background = new Background(mainScene, true);
    mainScene.add(background.getGroup());

    const arcadeMachine = new ArcadeMachine(mainScene, new THREE.Texture());

    const background2 = new Background2(mainScene, true);
    mainScene.add(background2.getGroup());

    function animate() {
      requestAnimationFrame(animate);

      background.update();
      arcadeMachine.update();
      background2.update();

      renderer.render(mainScene, camera);
    }

    animate();

    pg.logger.info('HomePage mounted!');
  },
});

export default HomePage;
