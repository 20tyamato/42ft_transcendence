export function createParticleCustomizationPanel(): HTMLElement {
  // パネルのコンテナを作成
  const panel = document.createElement('div');
  panel.id = 'particleCustomizationPanel';
  panel.className = 'customization-panel'; // hidden クラスを外す

  // タイトル
  const title = document.createElement('h2');
  title.textContent = 'Particle Settings';
  panel.appendChild(title);

  // 各設定オプションを生成するヘルパー関数
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
  (sizeOption.querySelector('input') as HTMLInputElement).max = '10';
  (sizeOption.querySelector('input') as HTMLInputElement).step = '0.1';
  panel.appendChild(sizeOption);

  // 速度設定
  const speedOption = createOption('Speed:', 'range', 'particleSpeed', '1');
  (speedOption.querySelector('input') as HTMLInputElement).min = '0.1';
  (speedOption.querySelector('input') as HTMLInputElement).max = '5';
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

  return panel;
}

// DOMContentLoaded 後にパネルを生成して body に追加
window.addEventListener('DOMContentLoaded', () => {
  const customizationPanel = createParticleCustomizationPanel();
  document.body.appendChild(customizationPanel);
});
