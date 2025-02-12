import i18next from '@/config/i18n';
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { updateActiveLanguageButton } from '@/models/Lang/repository';
import { isLoggedIn } from '@/models/User/auth';
import * as THREE from 'three';

const updateHomeContent = () => {
  const startBtn = document.querySelector('.btn');
  if (startBtn) startBtn.textContent = i18next.t('start');
};

const createThreeScene = () => {
  // Scene, Camera, Renderer
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

  // 透過背景にするため alpha: true を指定
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  // 背景透過 (0x000000, 0) で完全な透明に
  renderer.setClearColor(0x000000, 0);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('background')?.appendChild(renderer.domElement);

  // ライト設定
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 5, 5).normalize();
  scene.add(directionalLight);

  // ----- 卓球ラケットの形状を作成 -----
  const paddleGroup = new THREE.Group();

  // ラケット面（円形の薄いシリンダー）
  const bladeRadius = 0.7;
  const bladeThickness = 0.05; // 厚みを少しだけ持たせる
  const bladeGeometry = new THREE.CylinderGeometry(bladeRadius, bladeRadius, bladeThickness, 32);
  const bladeMaterial = new THREE.MeshStandardMaterial({ color: 0xff5733 });
  const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);

  // CylinderGeometry はデフォルトでY軸方向に高さが伸びるので、
  // ラケット面がXY平面になるように回転させる
  blade.rotation.x = Math.PI / 2;
  paddleGroup.add(blade);

  // グリップ（細長い立方体）
  const handleGeometry = new THREE.BoxGeometry(0.15, 1.0, 0.15);
  const handleMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
  const handle = new THREE.Mesh(handleGeometry, handleMaterial);

  // 取手がラケット面に自然につくよう、少し下に配置（例：-0.55）
  handle.position.y = -0.75;
  paddleGroup.add(handle);

  // シーンに追加
  scene.add(paddleGroup);

  // ラケットの初期位置・回転調整
  paddleGroup.position.y = 0.5;
  paddleGroup.rotation.z = Math.PI / 4;

  // カメラの位置
  camera.position.z = 5;

  // テーブルは不要とのことなので削除しました

  // アニメーション（ラケット回転）
  const animate = () => {
    requestAnimationFrame(animate);

    // ラケットを回転させる
    paddleGroup.rotation.y += 0.01;

    renderer.render(scene, camera);
  };
  animate();

  // リサイズ時の対応
  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });
};

const HomePage = new Page({
  name: 'Home',
  config: {
    layout: CommonLayout,
  },
  mounted: async ({ pg }: { pg: Page }) => {
    updateHomeContent();
    updateActiveLanguageButton();

    const btnEn = document.getElementById('lang-en');
    const btnJa = document.getElementById('lang-ja');
    const btnFr = document.getElementById('lang-fr');
    btnEn?.addEventListener('click', () => {
      i18next.changeLanguage('en', updateHomeContent);
      updateActiveLanguageButton();
    });
    btnJa?.addEventListener('click', () => {
      i18next.changeLanguage('ja', updateHomeContent);
      updateActiveLanguageButton();
    });
    btnFr?.addEventListener('click', () => {
      i18next.changeLanguage('fr', updateHomeContent);
      updateActiveLanguageButton();
    });

    pg.logger.info('HomePage mounted!');
    const loginBtn = document.querySelector('a[href="/login"]');
    loginBtn?.addEventListener('click', (event) => {
      event.preventDefault();
      if (isLoggedIn()) {
        window.location.href = '/modes';
      } else {
        window.location.href = '/login';
      }
    });

    // Three.js 初期化
    createThreeScene();
  },
});

export default HomePage;
