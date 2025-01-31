import { IGameScore } from '@/models/interface';
import * as THREE from 'three';
import Ball from './Ball';

let aiLevel = 1;
let running = false;
let ball: Ball, paddle1: THREE.Mesh, paddle2: THREE.Mesh;
let renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera;
const FIELD_WIDTH = 1200,
  FIELD_LENGTH = 3000;

const keysPressed: { ArrowLeft: boolean; ArrowRight: boolean } = {
  ArrowLeft: false,
  ArrowRight: false,
};

export let score: IGameScore = { player1: 0, player2: 0 };

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
  const fieldMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const fieldMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff, wireframe: true });
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

  ball = new Ball(scene, 30, new THREE.Vector3(0, 30, 0), aiLevel);

  setupLighting();
  setupPauseMenu();
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
    if (!running) return; // ポーズ中は停止

    updatePaddlePosition();
    // updateBallPosition();
    // ball.update(); // Ball クラスの update を使用
    processCpuPaddle();
    if (checkScore()) {
      running = false;
      if (onGameEnd) onGameEnd();
    }
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  };
  frame();
}

export function resetGame() {
  ball.setPosition(new THREE.Vector3(0, 0, 0));
  ball.resetVelocity();
  score = { player1: 0, player2: 0 };
  updateScoreBoard();
}

function resetBall() {
  ball.setPosition(new THREE.Vector3(0, 0, 0));
  ball.resetVelocity();
}

export function setupPauseMenu() {
  const pauseBtn = document.getElementById('pauseBtn');
  const pauseOverlay = document.getElementById('pauseOverlay');
  const resumeBtn = document.getElementById('resumeBtn');
  const retryBtn = document.getElementById('retryBtn');
  const exitBtn = document.getElementById('exitBtn');

  pauseBtn?.addEventListener('click', () => {
    running = false;
    if (pauseOverlay) {
      pauseOverlay.style.display = 'flex'; // ポーズ画面を表示
    }
  });

  resumeBtn?.addEventListener('click', () => {
    running = true;
    if (pauseOverlay) {
      pauseOverlay.style.display = 'none'; // メニューを非表示
    }
    startGameLoop(() => {
      alert('Game Over!');
      window.location.href = '/result';
    });
  });

  retryBtn?.addEventListener('click', () => {
    resetGame();
    window.location.reload();
  });

  exitBtn?.addEventListener('click', () => {
    window.location.href = '/singleplay/select';
  });
}

function setupLighting() {
  const ambientLight = new THREE.AmbientLight(0xffffff, 2);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xffffff, 1.5);
  pointLight.position.set(0, 500, 0);
  scene.add(pointLight);
}

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// キー操作をリスン
window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);

function createPaddle() {
  const geometry = new THREE.BoxGeometry(200, 30, 10);
  const material = new THREE.MeshLambertMaterial({ color: 0xcccccc, wireframe: true });
  return new THREE.Mesh(geometry, material);
}

function processCpuPaddle() {
  const cpuSpeed = Math.min(4 + aiLevel * 5, Math.abs(ball.getPosition().x - paddle2.position.x));
  const ballPos = ball.getPosition();
  const cpuPos = paddle2.position;

  if (cpuPos.x > ballPos.x) {
    cpuPos.x -= cpuSpeed;
  } else {
    cpuPos.x += cpuSpeed;
  }
}

function checkScore(): boolean {
  if (ball.getPosition().z > FIELD_LENGTH / 2) {
    score.player2++;
    updateScoreBoard();
    resetBall();
  } else if (ball.getPosition().z < -FIELD_LENGTH / 2) {
    score.player1++;
    updateScoreBoard();
    resetBall();
  }

  return score.player1 >= 15 || score.player2 >= 15;
}

function updateScoreBoard() {
  const scoreBoard = document.getElementById('scoreBoard');
  const username = localStorage.getItem('username') || 'Player';
  if (scoreBoard) {
    scoreBoard.textContent = `${username}  vs  CPU\n${score.player1}  -  ${score.player2}`;
    scoreBoard.style.fontSize = '2rem';
    scoreBoard.style.color = '#38bdf8';
    scoreBoard.style.textShadow = '0px 0px 10px rgba(0,0,0,0.5)';
    scoreBoard.style.textAlign = 'center';
    scoreBoard.style.position = 'absolute';
    scoreBoard.style.top = '10px';
    scoreBoard.style.width = '100%';
    scoreBoard.style.whiteSpace = 'pre-line';
  }
}

export function togglePause() {
  const pauseOverlay = document.getElementById('pauseOverlay');
  running = !running;
  pauseOverlay?.classList.toggle('hidden'); // UI を切り替え
  if (running) {
    startGameLoop(() => {
      alert('Game Over!');
      window.location.href = '/result';
    });
  }
}

export function getFinalScore() {
  return score;
}
