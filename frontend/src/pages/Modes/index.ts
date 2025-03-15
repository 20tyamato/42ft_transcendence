import i18next from '@/config/i18n';
import { Page } from '@/core/Page';
import AuthLayout from '@/layouts/AuthLayout';
import { fetchCurrentUser } from '@/models/User/repository';
import { setUserLanguage } from '@/utils/language';
import { updateText } from '@/utils/updateElements';
import Background from './Background';
import Stars from './Stars';
import * as THREE from 'three';

const DEFAULT_AVATAR_SRC = '/src/resources/avatar.png';
let isInternalNavigation = false;

const updatePageContent = (): void => {
  updateText('title', i18next.t('modes'));
  updateText('.single-mode', i18next.t('singleMode'));
  updateText('.multi-mode', i18next.t('multiMode'));
  updateText('.tournament-mode', i18next.t('tournamentMode'));
};

const navigateTo = (path: string): void => {
  isInternalNavigation = true;
  console.log(`Navigating to ${path}`);
  window.location.href = path;
};

const bindNavigationButton = (selector: string, path: string): void => {
  const button = document.querySelector(selector);
  if (button) {
    button.addEventListener('click', () => navigateTo(path));
  }
};

const registerNavigationButtons = (): void => {
  bindNavigationButton('.single-mode', '/singleplay/select');
  bindNavigationButton('.multi-mode', '/multiplay');
  bindNavigationButton('.tournament-mode', '/tournament');
};

const registerIconNavigation = (): void => {
  const logoutIcon = document.querySelector('.logout-icon');
  if (logoutIcon) {
    logoutIcon.addEventListener('click', () => navigateTo('/logout'));
  }
  const profileIcon = document.querySelector('.profile-icon');
  if (profileIcon) {
    profileIcon.addEventListener('click', () => navigateTo('/profile'));
  }
};

const updateUserAvatar = (avatar?: string): void => {
  const avatarEl = document.getElementById('avatar') as HTMLImageElement | null;
  if (avatarEl) {
    avatarEl.src = avatar || DEFAULT_AVATAR_SRC;
  }
};

const ModesPage = new Page({
  name: 'Modes',
  config: { layout: AuthLayout },
  mounted: async ({ pg, user }) => {
    setUserLanguage(user.language, updatePageContent);
    updateUserAvatar(user.avatar);

    registerNavigationButtons();
    registerIconNavigation();

    pg.logger.info('ModesPage mounted!');
    const canvas = document.getElementById('gl') as HTMLCanvasElement;
    if (!canvas) {
      console.error('Canvas element with id="gl" not found.');
      return;
    }
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    const scene = new THREE.Scene();
    const background = new Background(scene);
    const stars = new Stars(scene);

    function animate() {
      background.update();
      stars.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    animate();
  },
});

export default ModesPage;
