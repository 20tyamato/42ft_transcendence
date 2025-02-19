// グローバルにタイマーIDを保持する変数を定義
let idleTimer: number | null = null;

export const resetTimer = () => {
  const idleTimeout = 10000; // 10秒

  // 既にタイマーが設定されている場合はクリアする
  if (idleTimer !== null) {
    clearTimeout(idleTimer);
  }

  // 新たにタイマーをセットする
  idleTimer = window.setTimeout(() => {
    fetch('/logout/', { method: 'POST', credentials: 'include' })
      .then(response => {
        if (response.ok) {
          window.location.href = '/login/';
        }
      })
      .catch(error => console.error('Logout error:', error));
  }, idleTimeout);
};
