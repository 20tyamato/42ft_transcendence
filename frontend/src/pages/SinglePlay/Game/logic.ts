import * as THREE from 'three';

let aiLevel = 1;
let running = false;
let score = { player1: 0, player2: 0 };
let ball: THREE.Mesh, paddle1: THREE.Mesh, paddle2: THREE.Mesh;
let renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera;
const FIELD_WIDTH = 1200,
  FIELD_LENGTH = 3000,
  BALL_RADIUS = 20;

export function initGame() {
  const container = document.getElementById('container');
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(700, 500);
  container?.appendChild(renderer.domElement);

  camera = new THREE.PerspectiveCamera(45, 700 / 500, 0.1, 10000);
  camera.position.set(0, 100, FIELD_LENGTH / 2 + 500);

  scene = new THREE.Scene();
  scene.add(camera);

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

  const light = new THREE.HemisphereLight(0xffffff, 0x003300);
  scene.add(light);

  updateScoreBoard();
}

export function setAILevel(level: number) {
  aiLevel = level;
  console.log(`AI Level set to ${level}`);
}

export function startGameLoop(onGameEnd: () => void) {
  running = true;
  let frame = () => {
    if (!running) return;

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
  const cpuSpeed = 2 + aiLevel * 2; // レベルに応じた速度
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
  }
}
