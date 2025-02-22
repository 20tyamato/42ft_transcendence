const IDLE_TIMEOUT = 10000; // 10秒
let idleTimer: number | null = null;

export const resetTimer = () => {
  const idleTimeout = IDLE_TIMEOUT;

  if (idleTimer !== null) {
    clearTimeout(idleTimer);
  }

  idleTimer = window.setTimeout(() => {
    try {
      window.location.href = '/logout';
    } catch (error) {
      console.error('Logout API call failed:', error);
    }
  }, idleTimeout);
};

export const initResetTimerListeners = (): void => {
  const events = ['mousemove', 'keydown', 'click', 'scroll'];
  events.forEach((event) => {
    window.addEventListener(event, resetTimer);
  });
};
