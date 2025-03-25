import i18next from '@/config/i18n';
import { Page } from '@/core/Page';
import AuthLayout from '@/layouts/AuthLayout';
import { isLoggedIn } from '@/libs/Auth/currnetUser';
import { updateLanguage } from '@/models/User/repository';
import { registerLanguageSwitchers, updateActiveLanguageButton } from '@/utils/language';
import { updateText } from '@/utils/updateElements';
import * as THREE from 'three';
import ArcadeMachine from './ArcadeMachine';
import Background from './Background';
import Background2 from './Background2';

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
  updateText('a[href="/login"]', i18next.t('start'));
};

const HomePage = new Page({
  name: 'Home',
  config: { layout: AuthLayout },
  mounted: async ({ pg }): Promise<void> => {
    updatePageContent();
    updateActiveLanguageButton();

    registerLanguageSwitchers(updatePageContent);
    registerStartButton();

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
    mainScene.add(arcadeMachine.getGroup());

    const background2 = new Background2(mainScene, 1); // Replace '1' with the appropriate number if needed
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
