const IDLE_TIMEOUT = 10000; // 10秒
let idleTimer: number | null = null;

export const resetTimer = () => {
  if (idleTimer !== null) {
    clearTimeout(idleTimer);
  }

  idleTimer = window.setTimeout(() => {
    window.location.href = '/logout';
    idleTimer = null;
  }, IDLE_TIMEOUT);
};

export const initResetTimerListeners = (): void => {
  const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart', 'resize'];
  events.forEach((event) => {
    window.addEventListener(event, resetTimer);
  });
};
