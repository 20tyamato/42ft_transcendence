import i18next from '@/config/i18n';
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { storage } from '@/libs/localStorage';
import { updateLanguage, updateOnlineStatus } from '@/models/User/repository';
import { fetcherGuest } from '@/utils/fetcher';
import { registerLanguageSwitchers, updateActiveLanguageButton } from '@/utils/language';
import { registerTogglePassword } from '@/utils/togglePassword';
import { updateInnerHTML, updateText } from '@/utils/updateElements';
import * as THREE from 'three';
import Background from './Background';

const handleLoginSubmit = async (
  form: HTMLFormElement,
  responseMessage: HTMLElement
): Promise<void> => {
  const formData = new FormData(form);
  const loginData = {
    username: formData.get('username'),
    password: formData.get('password'),
  };

  try {
    const { data, ok } = await fetcherGuest('/api/login/', {
      method: 'POST',
      body: loginData,
    });

    if (ok) {
      const result = data;
      storage.setUserToken(result.token);

      i18next.changeLanguage(i18next.language);
      updateLanguage(i18next.language);
      updateOnlineStatus(true);

      responseMessage.textContent = i18next.t('loginSuccess');
      responseMessage.style.color = 'green';

      setTimeout(() => {
        window.location.href = '/modes';
      }, 1000);
    } else {
      const error = data;
      responseMessage.textContent = i18next.t('errorMessage', {
        error: error.message || i18next.t('invalidCredentials'),
      });
      responseMessage.style.color = 'red';
    }
  } catch (error) {
    console.error(error);
    // エラー文も多様化する必要あり
    responseMessage.textContent = i18next.t('unexpectedError');
    responseMessage.style.color = 'red';
  }
};

const registerLoginForm = (): void => {
  const form = document.getElementById('login-form') as HTMLFormElement | null;
  const responseMessage = document.getElementById('response-message');
  if (!form || !responseMessage) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    await handleLoginSubmit(form, responseMessage);
  });
};

const updatePageContent = (): void => {
  updateText('title', i18next.t('login'));
  updateText('.login-container h1', i18next.t('login'));
  updateText('label[for="username"]', i18next.t('username'));
  updateText('label[for="password"]', i18next.t('password'));
  updateText('button.btn.btn-primary', i18next.t('login'));
  updateInnerHTML('.centered-text', i18next.t('registerPrompt'));
};

const LoginPage = new Page({
  name: 'Login',
  config: { layout: CommonLayout },
  mounted: async ({ pg }): Promise<void> => {
    updatePageContent();
    updateActiveLanguageButton();

    registerLanguageSwitchers(updatePageContent);

    registerLoginForm();

    registerTogglePassword('toggle-password', 'password', 'password-icon');
    // Three.jsのセットアップ
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
    camera.position.set(0, 0, 1000);
    camera.lookAt(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    const background = new Background(scene);

    // アニメーションループ
    function animate() {
      requestAnimationFrame(animate);
      background.update();
      renderer.render(scene, camera);
    }
    animate();

    pg.logger.info('LoginPage mounted!');
  },
});

export default LoginPage;
