import * as THREE from 'three';

let particleMaterial: THREE.PointsMaterial;
let particleGeometry: THREE.BufferGeometry;
let particlePositions: Float32Array;
let particleSpeeds: Float32Array;

export function createParticleCustomizationPanel(): HTMLElement {
  const panel =
    document.getElementById('particleCustomizationPanel') || document.createElement('div');
  // const panel = document.createElement('div');
  panel.id = 'particleCustomizationPanel';
  panel.className = 'customization-panel'; // hidden クラスを外す

  const title = document.createElement('h2');
  title.textContent = 'Particle Settings';
  panel.appendChild(title);

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
  panel.appendChild(createOption('Color:', 'color', 'particleColor', '#ffffff'));

  // サイズ設定
  const sizeOption = createOption('Size:', 'range', 'particleSize', '2');
  (sizeOption.querySelector('input') as HTMLInputElement).min = '1';
  (sizeOption.querySelector('input') as HTMLInputElement).max = '100';
  (sizeOption.querySelector('input') as HTMLInputElement).step = '0.1';
  panel.appendChild(sizeOption);

  // 速度設定
  const speedOption = createOption('Speed:', 'range', 'particleSpeed', '1');
  (speedOption.querySelector('input') as HTMLInputElement).min = '0.1';
  (speedOption.querySelector('input') as HTMLInputElement).max = '10';
  (speedOption.querySelector('input') as HTMLInputElement).step = '0.1';
  panel.appendChild(speedOption);

  // 密度設定
  const densityOption = createOption('Density:', 'range', 'particleDensity', '10000');
  (densityOption.querySelector('input') as HTMLInputElement).min = '1000';
  (densityOption.querySelector('input') as HTMLInputElement).max = '20000';
  (densityOption.querySelector('input') as HTMLInputElement).step = '1000';
  panel.appendChild(densityOption);

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

  panel.appendChild(buttonContainer);

  const toggleBtn = document.getElementById('toggleCustomizationPanel');
  if (toggleBtn && panel) {
    toggleBtn.addEventListener('click', () => {
      panel.classList.toggle('hidden');
      if (panel.classList.contains('hidden')) {
        toggleBtn.textContent = 'Show Panel';
      } else {
        toggleBtn.textContent = 'Hide Panel';
      }
    });
  }

  function updateParticles(params: {
    color: string;
    size: number;
    speed: number;
    density: number;
    opacity: number;
  }): void {
    console.log('Updating particles with params:', params);

    // パーティクルの色を更新
    particleMaterial.color.set(params.color);

    // パーティクルのサイズを更新
    particleMaterial.size = params.size;

    // パーティクルの透明度を更新
    particleMaterial.opacity = params.opacity;

    // パーティクルの速度を更新
    for (let i = 0; i < particleSpeeds.length; i++) {
      particleSpeeds[i] = (Math.random() - 0.5) * params.speed;
    }

    // パーティクルの密度を更新
    if (particlePositions.length / 3 !== params.density) {
      initializeParticles(params);
    }

    particleGeometry.attributes.position.needsUpdate = true;
  }

  // リアルタイム更新用イベントリスナー
  panel.querySelectorAll('input').forEach((input) => {
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
      // コールバックでパーティクルの更新処理を呼び出す
      updateParticles({ color, size, speed, density, opacity });
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
    console.log('Particle settings saved:', settings);
  });

  // Reset ボタンのイベント：初期設定に戻す
  resetBtn.addEventListener('click', () => {
    // 例: 初期値
    (document.getElementById('particleColor') as HTMLInputElement).value = '#ffffff';
    (document.getElementById('particleSize') as HTMLInputElement).value = '2';
    (document.getElementById('particleSpeed') as HTMLInputElement).value = '1';
    (document.getElementById('particleDensity') as HTMLInputElement).value = '10000';
    (document.getElementById('particleOpacity') as HTMLInputElement).value = '0.8';
    console.log('Particle settings reset to defaults');
  });
  return panel;
}
