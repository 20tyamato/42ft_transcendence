import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import * as THREE from 'three';

const createThreeScene = () => {
  // Scene, Camera, Renderer
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('background')?.appendChild(renderer.domElement);

  // Light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 5, 5).normalize();
  scene.add(directionalLight);

  // Paddle Geometry (Placeholder for actual paddle design)
  const paddleGeometry = new THREE.BoxGeometry(1, 0.1, 2);
  const paddleMaterial = new THREE.MeshStandardMaterial({
    color: 0xff5733,
  });
  const paddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
  scene.add(paddle);

  // Position the paddle
  paddle.position.y = 0.5; // Lift above the table
  paddle.rotation.z = Math.PI / 4;

  // Table (Optional base for aesthetics)
  const tableGeometry = new THREE.BoxGeometry(4, 0.1, 2);
  const tableMaterial = new THREE.MeshStandardMaterial({ color: 0x2a9df4 });
  const table = new THREE.Mesh(tableGeometry, tableMaterial);
  scene.add(table);

  table.position.y = 0; // Align table below the paddle

  // Camera Position
  camera.position.z = 5;

  // Animate Paddle
  const animate = () => {
    requestAnimationFrame(animate);

    // Rotate paddle
    paddle.rotation.y += 0.01;

    renderer.render(scene, camera);
  };

  animate();

  // Adjust renderer on resize
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
  mounted: async () => {
    const loginBtn = document.querySelector('a[href="/login"]');

    loginBtn?.addEventListener('click', (event) => {
      event.preventDefault();
      window.location.href = '/login';
    });

    // Initialize Three.js Scene
    createThreeScene();
  },
});

export default HomePage;
