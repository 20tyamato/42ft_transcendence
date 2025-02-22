const IDLE_TIMEOUT = 10000; // 10秒
let idleTimer: number | null = null;

export const resetTimer = () => {
  const idleTimeout = IDLE_TIMEOUT;

  if (idleTimer !== null) {
    clearTimeout(idleTimer);
  }

  idleTimer = window.setTimeout(() => {
    window.location.href = '/logout';
  }, idleTimeout);
};

export const initResetTimerListeners = (): void => {
  const events = ['mousemove', 'keydown', 'click', 'scroll'];
  events.forEach((event) => {
    window.addEventListener(event, resetTimer);
  });
};
