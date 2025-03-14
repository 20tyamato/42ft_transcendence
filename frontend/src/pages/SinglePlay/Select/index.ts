import i18next from '@/config/i18n';
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { checkUserAccess } from '@/models/User/auth';
import { fetchCurrentUser } from '@/models/User/repository';
import { updateText } from '@/utils/updateElements';
import Background from './Background';
import * as THREE from 'three';

const updatePageContent = () => {
  updateText('title', i18next.t('levelSelection'));
  updateText('.easy-level h1', i18next.t('easyLevel'));
  updateText('.medium-level h1', i18next.t('mediumLevel'));
  updateText('.hard-level h1', i18next.t('hardLevel'));
  updateText('.secret-level h1', i18next.t('secretLevel'));
};

const SinglePlaySelectPage = new Page({
  name: 'SinglePlay/Select',
  config: {
    layout: CommonLayout,
  },
  mounted: async ({ pg }: { pg: Page }): Promise<void> => {
    const canvas = document.getElementById('gl') as HTMLCanvasElement;
    const renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setSize(window.innerWidth, window.innerHeight);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    checkUserAccess();

    const userData = await fetchCurrentUser();
    if (userData.language) {
      document.documentElement.lang = userData.language;
      i18next.changeLanguage(userData.language, updatePageContent);
    }

    // Oniモードの表示条件をチェック（例: userData.points >= 1000）
    const oniSelectable = userData.points >= 1000;

    const secretLevelCard = document.querySelector('.level-card.secret-level');
    if (secretLevelCard instanceof HTMLElement) {
      if (!oniSelectable) {
        // ポイントが足りない場合、カードを暗くし、クリック無効にする
        secretLevelCard.style.opacity = '0.3';
        secretLevelCard.style.pointerEvents = 'none';
      } else {
        // ポイントが足りている場合、通常表示
        secretLevelCard.style.opacity = '1';
        secretLevelCard.style.pointerEvents = 'auto';
      }
    }

    const levelButtons = document.querySelectorAll('.level-button');

    function showLoadingScreen(targetPath: string) {
      const loadingOverlay = document.getElementById('loading-overlay');
      const countdownDisplay = document.getElementById('countdown');
      let remaining = 3;

      if (loadingOverlay && countdownDisplay) {
        loadingOverlay.classList.remove('hidden');
        countdownDisplay.textContent = remaining.toString();

        const intervalId = setInterval(() => {
          remaining -= 1;
          countdownDisplay.textContent = remaining.toString();

          if (remaining <= 0) {
            clearInterval(intervalId);
            window.location.href = targetPath;
          }
        }, 1000);
      }
    }

    levelButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const level = button.getAttribute('data-level');
        if (level) {
          localStorage.setItem('selectedLevel', level);
          console.log(`Selected level: ${level}`);
          showLoadingScreen('/singleplay/game');
        } else {
          console.error('Level attribute not found on button.');
        }
      });
    });

    const background = new Background(scene);

    function animate() {
      background.update();
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }
    animate();
  },
});

export default SinglePlaySelectPage;
