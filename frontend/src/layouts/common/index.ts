// import { Layout } from '@/core/Layout';
// import logoPic from './42_logo.svg';
// import avatarPic from './avatar.png';
// import logout from './logout.png';

// const CommonLayout = new Layout({
//   name: 'common',
// });

// // TODO: change to env
// const MIN_WIDTH = 1024;
// const MIN_HEIGHT = 768;
// const DESIRED_RATIO = 16 / 9;
// const RATIO_TOLERANCE = 0.1;

// function checkScreenSize() {

//   const errorOverlay = document.getElementById('screen-error');
//   if (!errorOverlay) {
//     console.error('Error: The #screen-error element for displaying errors does not exist.');
//     return;
//   }

//   const currentWidth = window.innerWidth;
//   const currentHeight = window.innerHeight;
//   const currentRatio = currentWidth / currentHeight;
//   if (currentWidth < MIN_WIDTH || currentHeight < MIN_HEIGHT) {
//     errorOverlay.classList.add('active');
//     return;
//   }
//   const ratioDifference = Math.abs(currentRatio - DESIRED_RATIO) / DESIRED_RATIO;
//   if (ratioDifference > RATIO_TOLERANCE) {
//     errorOverlay.classList.add('active');
//     return;
//   }
//   errorOverlay.classList.remove('active');
// }

// window.addEventListener('load', checkScreenSize);
// window.addEventListener('resize', checkScreenSize);

// export default CommonLayout;
// export { avatarPic, checkScreenSize, logoPic, logout };
import { Layout } from '@/core/Layout';
import logoPic from './42_logo.svg';
import avatarPic from './avatar.png';
import logout from './logout.png';

const CommonLayout = new Layout({
  name: 'common',
});

// 画面サイズの設定
const MIN_WIDTH: number = 1024;
const MIN_HEIGHT: number = 768;
const DESIRED_RATIO: number = 16 / 9;
const RATIO_TOLERANCE: number = 0.1;

/**
 * 画面サイズをチェックし、不適切な場合はエラーメッセージを表示
 */
const checkScreenSize = (): void => {
  const errorOverlay = document.getElementById('screen-error') as HTMLElement | null;
  if (!errorOverlay) {
    console.error('Error: #screen-error element is missing.');
    return;
  }

  const currentWidth = window.innerWidth;
  const currentHeight = window.innerHeight;
  const currentRatio = currentWidth / currentHeight;

  if (currentWidth < MIN_WIDTH || currentHeight < MIN_HEIGHT) {
    errorOverlay.classList.add('active');
    return;
  }

  const ratioDifference = Math.abs(currentRatio - DESIRED_RATIO) / DESIRED_RATIO;
  errorOverlay.classList.toggle('active', ratioDifference > RATIO_TOLERANCE);
};

// 初回実行 & イベントリスナー登録
(() => {
  checkScreenSize();
  window.addEventListener('resize', checkScreenSize);
})();

export default CommonLayout;
export { avatarPic, checkScreenSize, logoPic, logout };
