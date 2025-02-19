import { Layout } from '@/core/Layout';
import logoPic from '@/resources/42_logo.svg';
import avatarPic from '@/resources/avatar.png';
import logout from '@/resources/logout.png';

const CommonLayout = new Layout({
  name: 'common',
});

// For dev purpose
function checkScreenSize() {
  console.log('Dummy checkScreenSize');
}

// TODO: change to env
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

export default CommonLayout;
export { avatarPic, checkScreenSize, logoPic, logout };
