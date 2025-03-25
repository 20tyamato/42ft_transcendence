import { logger } from '@/core/Logger';
import * as THREE from 'three';
import Experience from './Experience';

let particleMaterial: THREE.PointsMaterial;
let particleGeometry: THREE.BufferGeometry;
let particlePositions: Float32Array = new Float32Array(0);
let particleSpeeds: Float32Array = new Float32Array(0);
let particleSystem: THREE.Points | null = null;

/**
 * パーティクルシステムを初期化し、シーンに追加する関数
 */
function initializeParticles(params: {
  color: string;
  size: number;
  speed: number;
  density: number;
  opacity: number;
}): void {
  const experience = Experience.getInstance(document.getElementById('gl') as HTMLCanvasElement);
  const scene = experience.scene;

  // 既存のパーティクルシステムがあれば削除
  if (particleSystem) {
    scene.remove(particleSystem);
  }

  const density = params.density;
  particlePositions = new Float32Array(density * 3);
  particleSpeeds = new Float32Array(density);
  for (let i = 0; i < density; i++) {
    // 広めのランダムな位置 (例: -5000 ～ +5000)
    particlePositions[i * 3] = (Math.random() - 0.5) * 3000;
    particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 3000;
    particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 3000;
    // 速度（ランダムな方向）
    particleSpeeds[i] = (Math.random() - 0.5) * params.speed;
  }
  particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

  particleMaterial = new THREE.PointsMaterial({
    color: new THREE.Color(params.color),
    size: params.size,
    opacity: params.opacity,
    transparent: true,
    depthWrite: false,
  });

  particleSystem = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particleSystem);
}

/**
 * updateParticles(): パーティクルシステムの各パラメータを更新する関数
 */
export function updateParticles(params: {
  color: string;
  size: number;
  speed: number;
  density: number;
  opacity: number;
}): void {
  // パーティクルマテリアルの更新
  if (particleMaterial) {
    particleMaterial.color.set(params.color);
    particleMaterial.size = params.size;
    particleMaterial.opacity = params.opacity;
  }

  // 現在の粒子数を計算（存在しない場合は再初期化）
  const currentDensity = particlePositions ? particlePositions.length / 3 : 0;
  if (currentDensity !== params.density) {
    // 粒子密度が変わった場合は、再初期化する
    initializeParticles(params);
  } else {
    // 速度の更新（ランダムに再生成）
    for (let i = 0; i < particleSpeeds.length; i++) {
      particleSpeeds[i] = (Math.random() - 0.5) * params.speed;
    }
    // 既存のジオメトリの位置属性を更新する（必要ならここで粒子の動きを更新するロジックも追加）
    particleGeometry.attributes.position.needsUpdate = true;
  }
}

/**
 * createParticleCustomizationPanel(): パネルの作成とイベントリスナー登録
 */
export function createParticleCustomizationPanel(
  updateParticlesCallback: typeof updateParticles = updateParticles
): HTMLElement {
  const panel =
    document.getElementById('particleCustomizationPanel') || document.createElement('div');
  panel.id = 'particleCustomizationPanel';
  panel.className = 'customization-panel'; // 初期状態は表示

  // ヘッダーコンテナ作成（Flexレイアウトでトグルボタンとタイトルを横並びに）
  const headerContainer = document.createElement('div');
  headerContainer.className = 'customization-header';
  panel.appendChild(headerContainer);

  // トグルボタン
  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'toggleCustomizationPanel';
  toggleBtn.className = 'btn toggle-btn';
  toggleBtn.textContent = '▶'; // 初期は表示状態を示す▼
  headerContainer.appendChild(toggleBtn);

  // タイトル（トグルの右隣に配置）
  const title = document.createElement('h2');
  title.textContent = 'Particle Settings';
  title.className = 'customization-title';
  headerContainer.appendChild(title);

  // パネル内容部分をラップする div（トグル対象）
  const content = document.createElement('div');
  content.id = 'particleCustomizationContent';
  content.classList.add('hidden');
  panel.appendChild(content);

  function createOption(
    labelText: string,
    inputType: string,
    inputId: string,
    defaultValue: string
  ): HTMLElement {
    const container = document.createElement('div');
    container.className = 'customization-option';

    const label = document.createElement('label');
    label.setAttribute('for', inputId);
    label.textContent = labelText;
    container.appendChild(label);

    const input = document.createElement('input');
    input.type = inputType;
    input.id = inputId;
    input.value = defaultValue;
    container.appendChild(input);

    return container;
  }

  // カラー設定
  content.appendChild(createOption('Color:', 'color', 'particleColor', '#ffffff'));

  // サイズ設定
  const sizeOption = createOption('Size:', 'range', 'particleSize', '2');
  (sizeOption.querySelector('input') as HTMLInputElement).min = '1';
  (sizeOption.querySelector('input') as HTMLInputElement).max = '200';
  (sizeOption.querySelector('input') as HTMLInputElement).step = '1';
  content.appendChild(sizeOption);

  // 速度設定
  const speedOption = createOption('Speed:', 'range', 'particleSpeed', '1');
  (speedOption.querySelector('input') as HTMLInputElement).min = '0.1';
  (speedOption.querySelector('input') as HTMLInputElement).max = '10';
  (speedOption.querySelector('input') as HTMLInputElement).step = '0.1';
  content.appendChild(speedOption);

  // 密度設定
  const densityOption = createOption('Density:', 'range', 'particleDensity', '10000');
  (densityOption.querySelector('input') as HTMLInputElement).min = '1000';
  (densityOption.querySelector('input') as HTMLInputElement).max = '20000';
  (densityOption.querySelector('input') as HTMLInputElement).step = '1000';
  content.appendChild(densityOption);

  // 透明度設定
  const opacityOption = createOption('Opacity:', 'range', 'particleOpacity', '0.8');
  (opacityOption.querySelector('input') as HTMLInputElement).min = '0';
  (opacityOption.querySelector('input') as HTMLInputElement).max = '1';
  (opacityOption.querySelector('input') as HTMLInputElement).step = '0.05';
  content.appendChild(opacityOption);

  // ボタン群のコンテナ
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'customization-buttons';

  // Save ボタン
  const saveBtn = document.createElement('button');
  saveBtn.id = 'saveParticleSettings';
  saveBtn.className = 'btn';
  saveBtn.textContent = 'Save';
  buttonContainer.appendChild(saveBtn);

  // Reset ボタン
  const resetBtn = document.createElement('button');
  resetBtn.id = 'resetParticleSettings';
  resetBtn.className = 'btn';
  resetBtn.textContent = 'Reset';
  buttonContainer.appendChild(resetBtn);

  content.appendChild(buttonContainer);

  // トグルボタンの挙動：内容部分の表示／非表示を切り替える
  toggleBtn.addEventListener('click', () => {
    content.classList.toggle('hidden');
    if (content.classList.contains('hidden')) {
      toggleBtn.textContent = '▶';
    } else {
      toggleBtn.textContent = '▼';
    }
  });

  // リアルタイム更新用イベントリスナー：各入力の値変更で updateParticles を呼ぶ
  content.querySelectorAll('input').forEach((input) => {
    input.addEventListener('input', () => {
      const color = (document.getElementById('particleColor') as HTMLInputElement).value;
      const size = parseFloat((document.getElementById('particleSize') as HTMLInputElement).value);
      const speed = parseFloat(
        (document.getElementById('particleSpeed') as HTMLInputElement).value
      );
      const density = parseInt(
        (document.getElementById('particleDensity') as HTMLInputElement).value,
        10
      );
      const opacity = parseFloat(
        (document.getElementById('particleOpacity') as HTMLInputElement).value
      );
      updateParticlesCallback({ color, size, speed, density, opacity });
    });
  });

  // Save ボタンのイベント：設定を localStorage に保存
  saveBtn.addEventListener('click', () => {
    const color = (document.getElementById('particleColor') as HTMLInputElement).value;
    const size = (document.getElementById('particleSize') as HTMLInputElement).value;
    const speed = (document.getElementById('particleSpeed') as HTMLInputElement).value;
    const density = (document.getElementById('particleDensity') as HTMLInputElement).value;
    const opacity = (document.getElementById('particleOpacity') as HTMLInputElement).value;
    const settings = { color, size, speed, density, opacity };
    localStorage.setItem('particleSettings', JSON.stringify(settings));
    logger.info('Particle settings saved:', settings);
  });

  // Reset ボタンのイベント：初期設定に戻す
  resetBtn.addEventListener('click', () => {
    (document.getElementById('particleColor') as HTMLInputElement).value = '#ffffff';
    (document.getElementById('particleSize') as HTMLInputElement).value = '2';
    (document.getElementById('particleSpeed') as HTMLInputElement).value = '1';
    (document.getElementById('particleDensity') as HTMLInputElement).value = '10000';
    (document.getElementById('particleOpacity') as HTMLInputElement).value = '0.8';
    updateParticlesCallback({
      color: '#ffffff',
      size: 2,
      speed: 1,
      density: 10000,
      opacity: 0.8,
    });
    logger.info('Particle settings reset to defaults');
  });

  return panel;
}
