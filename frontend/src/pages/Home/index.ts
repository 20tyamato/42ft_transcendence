import i18next from '@/config/i18n';
import { Page } from '@/core/Page';
import AuthLayout from '@/layouts/AuthLayout';
import { fetchCurrentUser } from '@/models/User/repository';
import { setUserLanguage } from '@/utils/language';
import { updateText } from '@/utils/updateElements';
import ArcadeMachine from './ArcadeMachine';
import GameRenderer from './GameRenderer';
import Background from './Background';
import * as THREE from 'three';
import { BallsGroup } from './BallFactory';

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
      1000
    );
    // camera.position.set(0, 0, 1000);
    // camera.lookAt(0, 0, 5);
    camera.position.set(0, 0, 1000);
    camera.lookAt(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    const background = new Background(scene);
    const gameRenderer = new GameRenderer(renderer);
    const arcadeMachine = new ArcadeMachine(scene, gameRenderer.renderTarget.texture);

    const ballsGroup = new BallsGroup();
    scene.add(ballsGroup.getGroup());

    function animate() {
      gameRenderer.update();
      background.update();
      arcadeMachine.update();
      ballsGroup.update();
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }
    animate();

    // ユーザーデータやその他の UI の処理は省略…
    pg.logger.info('HomePage mounted!');
  },
});

export default HomePage;
