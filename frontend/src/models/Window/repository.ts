import { API_URL } from '@/config/config';
import { updateOnlineStatus } from '@/models/User/repository';

const clearUserSession = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.clear();
};

// idleTimer をモジュールスコープで保持
let idleTimer: number | null = null;

export const resetTimer = () => {
  const idleTimeout = 10000; // 10秒

  // 既にタイマーが設定されている場合はクリアする
  if (idleTimer !== null) {
    clearTimeout(idleTimer);
  }

  // 新たなタイマーをセットする
  idleTimer = window.setTimeout(() => {
    try {
      updateOnlineStatus(false);
      fetch(`${API_URL}/api/logout/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      clearUserSession();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout API call failed:', error);
    }
  }, idleTimeout);
};
