import * as THREE from 'three';

let aiLevel = 1;
let running = false;
let ball: THREE.Mesh, paddle1: THREE.Mesh, paddle2: THREE.Mesh;
let renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera;
const FIELD_WIDTH = 1200,
  FIELD_LENGTH = 3000,
  BALL_RADIUS = 20;

const keysPressed: { ArrowLeft: boolean; ArrowRight: boolean } = {
  ArrowLeft: false,
  ArrowRight: false,
};

export interface GameScore {
  player1: number;
  player2: number;
}

export let score: GameScore = { player1: 0, player2: 0 };

let ballVelocity = new THREE.Vector3(0, 0, -10); // ボールの初期速度

export function initGame() {
  const container = document.getElementById('container');
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  container?.appendChild(renderer.domElement);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000);
  camera.position.set(0, 200, FIELD_LENGTH / 2 + 1000);

  scene = new THREE.Scene();

  // フィールド追加
  const fieldGeometry = new THREE.BoxGeometry(FIELD_WIDTH, 5, FIELD_LENGTH);
  const fieldMaterial = new THREE.MeshLambertMaterial({ color: 0x003300 });
  const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
  field.position.set(0, -50, 0);
  scene.add(field);

  // パドルとボール
  paddle1 = createPaddle();
  paddle1.position.z = FIELD_LENGTH / 2;
  scene.add(paddle1);

  paddle2 = createPaddle();
  paddle2.position.z = -FIELD_LENGTH / 2;
  scene.add(paddle2);

  const ballGeometry = new THREE.SphereGeometry(BALL_RADIUS, 16, 16);
  const ballMaterial = new THREE.MeshLambertMaterial({ color: 0xcc0000 });
  ball = new THREE.Mesh(ballGeometry, ballMaterial);
  ball.position.set(0, 0, 0); // ボールの初期位置を設定
  scene.add(ball);

  // ライト追加
  const updateBallLight = setupLighting();

  updateScoreBoard();

  // 全画面対応
  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  function setupLighting() {
    // 環境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 2);
    scene.add(ambientLight);

    // ポイントライト
    const pointLight = new THREE.PointLight(0xffffff, 1.5);
    pointLight.position.set(0, 500, 0);
    scene.add(pointLight);

    // ボールの光
    const ballLight = new THREE.PointLight(0xff4d4d, 1.5, 500);
    ballLight.position.set(ball.position.x, ball.position.y, ball.position.z);
    scene.add(ballLight);

    // 光をボールに追従させる
    function updateBallLight() {
      ballLight.position.set(ball.position.x, ball.position.y, ball.position.z);
    }
    return updateBallLight;
  }

  function updateBallPosition() {
    ball.position.add(ballVelocity); // ボールの位置を更新
    updateBallLight(); // ボールの光を更新
  }

  // 全画面対応
  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  // キー操作をリスン
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  // 「GAME START」表示
  showGameStartText();
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'ArrowLeft') keysPressed.ArrowLeft = true;
  if (event.key === 'ArrowRight') keysPressed.ArrowRight = true;
}

function handleKeyUp(event: KeyboardEvent) {
  if (event.key === 'ArrowLeft') keysPressed.ArrowLeft = false;
  if (event.key === 'ArrowRight') keysPressed.ArrowRight = false;
}

function updatePaddlePosition() {
  const paddleSpeed = 10;
  const halfFieldWidth = FIELD_WIDTH / 2;

  if (keysPressed.ArrowLeft && paddle1.position.x > -halfFieldWidth + 100) {
    paddle1.position.x -= paddleSpeed;
  }

  if (keysPressed.ArrowRight && paddle1.position.x < halfFieldWidth - 100) {
    paddle1.position.x += paddleSpeed;
  }
}

function showGameStartText() {
  const gameStartDiv = document.createElement('div');
  gameStartDiv.classList.add('gameStartText');
  gameStartDiv.innerText = 'GAME START!';
  document.body.appendChild(gameStartDiv);

  setTimeout(() => {
    gameStartDiv.remove();
    startGameLoop(() => {
      localStorage.setItem('finalScore', JSON.stringify(score));
      window.location.href = '/result';
    });
  }, 3000);
}

export function setAILevel(level: number) {
  aiLevel = level;
  console.log(`AI Level set to ${level}`);
}

export function startGameLoop(onGameEnd: () => void) {
  running = true;
  const frame = () => {
    if (!running) return;

    updatePaddlePosition();
    updateBallPosition();
    processCpuPaddle();
    if (checkScore()) {
      running = false;
      onGameEnd();
    }
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  };
  frame();
}

export function resetGame() {
  ball.position.set(0, 0, 0);
  score = { player1: 0, player2: 0 };
  updateScoreBoard();
}

function createPaddle() {
  const geometry = new THREE.BoxGeometry(200, 30, 10);
  const material = new THREE.MeshLambertMaterial({ color: 0xcccccc });
  return new THREE.Mesh(geometry, material);
}

function processCpuPaddle() {
  const cpuSpeed = Math.min(4 + aiLevel * 3, Math.abs(ball.position.x - paddle2.position.x));
  const ballPos = ball.position;
  const cpuPos = paddle2.position;

  if (cpuPos.x > ballPos.x) {
    cpuPos.x -= cpuSpeed;
  } else {
    cpuPos.x += cpuSpeed;
  }
}

const velocity = { x: 5, z: -10 }; // ボールの速度を変数として保持

function updateBallPosition() {
  ball.position.x += velocity.x;
  ball.position.z += velocity.z;

  if (
    ball.position.x < -FIELD_WIDTH / 2 + BALL_RADIUS ||
    ball.position.x > FIELD_WIDTH / 2 - BALL_RADIUS
  ) {
    velocity.x *= -1; // 壁で反射
  }

  if (checkPaddleCollision(paddle1) || checkPaddleCollision(paddle2)) {
    velocity.z *= -1; // パドルで反射
    velocity.x += Math.random() * 2 - 1; // 軽いランダム性を追加
  }
}

function checkPaddleCollision(paddle: THREE.Mesh): boolean {
  const paddleBounds = {
    xMin: paddle.position.x - 100,
    xMax: paddle.position.x + 100,
    zMin: paddle.position.z - 10,
    zMax: paddle.position.z + 10,
  };

  return (
    ball.position.x > paddleBounds.xMin &&
    ball.position.x < paddleBounds.xMax &&
    ball.position.z > paddleBounds.zMin &&
    ball.position.z < paddleBounds.zMax
  );
}

function checkScore() {
  if (ball.position.z > FIELD_LENGTH / 2) {
    score.player2++;
    updateScoreBoard();
    resetBall();
  } else if (ball.position.z < -FIELD_LENGTH / 2) {
    score.player1++;
    updateScoreBoard();
    resetBall();
  }

  return score.player1 >= 15 || score.player2 >= 15;
}

function resetBall() {
  ball.position.set(0, 0, 0);
}

function updateScoreBoard() {
  const scoreBoard = document.getElementById('scoreBoard');
  if (scoreBoard) {
    scoreBoard.textContent = `Player 1: ${score.player1} Player 2: ${score.player2}`;
    scoreBoard.style.fontSize = '2rem';
    scoreBoard.style.color = '#38bdf8';
    scoreBoard.style.textShadow = '0px 0px 10px rgba(0,0,0,0.5)';
    scoreBoard.style.textAlign = 'center';
    scoreBoard.style.position = 'absolute';
    scoreBoard.style.top = '10px';
    scoreBoard.style.width = '100%';
  }
}

export function getFinalScore() {
  return score;
}
