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
  scene.add(ball);

  // ライト追加
  const ambientLight = new THREE.AmbientLight(0x404040, 3);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xffffff, 1);
  pointLight.position.set(0, 500, 0);
  scene.add(pointLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(0, 1, 1).normalize();
  scene.add(directionalLight);

  const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
  hemisphereLight.position.set(0, 200, 0);
  scene.add(hemisphereLight);

  updateScoreBoard();

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
  gameStartDiv.style.position = 'absolute';
  gameStartDiv.style.top = '50%';
  gameStartDiv.style.left = '50%';
  gameStartDiv.style.transform = 'translate(-50%, -50%)';
  gameStartDiv.style.color = '#fff';
  gameStartDiv.style.fontSize = '4rem';
  gameStartDiv.style.fontWeight = 'bold';
  gameStartDiv.style.textShadow = '0px 0px 10px rgba(0,0,0,0.5)';
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
  const cpuSpeed = 2 + aiLevel * 2;
  const ballPos = ball.position;
  const cpuPos = paddle2.position;

  if (cpuPos.x > ballPos.x) {
    cpuPos.x -= Math.min(cpuPos.x - ballPos.x, cpuSpeed);
  } else {
    cpuPos.x += Math.min(ballPos.x - cpuPos.x, cpuSpeed);
  }
}

function updateBallPosition() {
  const velocity = { x: 5, z: -10 };
  ball.position.x += velocity.x;
  ball.position.z += velocity.z;

  if (ball.position.x < -FIELD_WIDTH / 2 || ball.position.x > FIELD_WIDTH / 2) {
    velocity.x *= -1;
  }
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