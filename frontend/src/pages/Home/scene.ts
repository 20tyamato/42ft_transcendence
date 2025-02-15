import * as THREE from 'three';

const createThreeScene = () => {
  // シーン、カメラ、レンダラーの初期設定
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75, window.innerWidth / window.innerHeight, 0.1, 1000
  );
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0); // 背景を透過
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('background')?.appendChild(renderer.domElement);

  // ライト設定 (MeshBasicMaterial の場合はライティング影響なし。後で Standard 等に戻すとき用)
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 5, 5).normalize();
  scene.add(directionalLight);

  // ■ テクスチャを生成するヘルパー関数
  //   大きめのキャンバス + はっきりした色 + 文字サイズはやや小さめ
  function createBallTexture(number, backgroundColor, textColor) {
    const size = 512; // 大きめに確保
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // 背景を一色で塗りつぶし
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, size, size);

      // 文字のサイズはキャンバスの 30% 程度に設定
      const fontSize = size * 0.3;
      ctx.font = `${fontSize}px sans-serif`;
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // キャンバス中央に描画
      ctx.fillText(number, size / 2, size / 2);
    }

    // テクスチャとして返す
    return new THREE.CanvasTexture(canvas);
  }

  // ■ ボールの作成
  const ballRadius = 1;
  const ballGeometry = new THREE.SphereGeometry(ballRadius, 32, 32);

  // 数字「4」用のマテリアル（デバッグ用に MeshBasicMaterial）
  const ball4Material = new THREE.MeshBasicMaterial({
    map: createBallTexture('4', '#ff0000', '#ffffff'),
  });
  // 数字「2」用のマテリアル（デバッグ用に MeshBasicMaterial）
  const ball2Material = new THREE.MeshBasicMaterial({
    map: createBallTexture('2', '#0000ff', '#ffffff'),
  });

  // ボールを生成
  const ball4 = new THREE.Mesh(ballGeometry, ball4Material);
  ball4.position.set(-1.5, ballRadius + 0.01, 0);

  // テクスチャの「中央」が赤道にくるため、数字が正面に来るよう少し回転
  ball4.rotation.y = -Math.PI * 1 / 2;
  ball4.rotation.x = -Math.PI * 1 / 8;
  scene.add(ball4);

  const ball2 = new THREE.Mesh(ballGeometry, ball2Material);
  ball2.position.set(1.5, ballRadius + 0.01, 0);
  ball2.rotation.y = -Math.PI / 2;
  ball2.rotation.x = -Math.PI * 1 / 8;
  scene.add(ball2);

  // ■ バウンス用の物理パラメーター
  const gravity = -9.8;   // 重力加速度
  const restitution = 1.0; // 反発係数（エネルギー損失なし）

  // 各ボールの物理情報
  const balls = [
    { mesh: ball4, velocity: new THREE.Vector3(0, 7, 0), radius: ballRadius },
    { mesh: ball2, velocity: new THREE.Vector3(0, 6, 0), radius: ballRadius },
  ];

  // カメラの位置設定
  camera.position.set(0, 8, 10);
  camera.lookAt(0, 0, 0);

  let prevTime = performance.now();

  // ■ アニメーションループ
  const animate = () => {
    requestAnimationFrame(animate);
    const currentTime = performance.now();
    const dt = (currentTime - prevTime) / 1000; // 経過時間（秒）
    prevTime = currentTime;

    // ボールに対する重力 & バウンス処理
    balls.forEach((ball) => {
      // 重力
      ball.velocity.y += gravity * dt;
      // 速度に基づく位置更新
      ball.mesh.position.y += ball.velocity.y * dt;

      // 床 (y=0) との衝突判定
      if (ball.mesh.position.y <= ball.radius) {
        ball.mesh.position.y = ball.radius;
        ball.velocity.y = -ball.velocity.y * restitution;
      }
    });

    // 描画
    renderer.render(scene, camera);
  };
  animate();

  // ■ リサイズ対応
  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });
};

export default createThreeScene;
