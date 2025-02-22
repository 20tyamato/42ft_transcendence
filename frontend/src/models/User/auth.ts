import { API_URL } from '@/config/config';
import { updateOnlineStatus } from '@/models/User/repository';

export function checkUserAccess(): string {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login';
    throw new Error('Token does not exist, redirected to login page.');
  }
  return token;
}

export function isLoggedIn(): boolean {
  return !!localStorage.getItem('token');
}

const clearUserSession = (): void => {
  localStorage.clear();
};

export const executeLogout = async (): Promise<void> => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.warn('No token found in local storage. Skipping logout.');
    return;
  }

  const url = `${API_URL}/api/logout/`;
  const data = JSON.stringify({});

  try {
    updateOnlineStatus(false);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, data);
    } else {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
        body: data,
        credentials: 'include',
        keepalive: true,
      });
      if (!response.ok) {
        console.error('Logout API call failed with status:', response.status);
      }
      clearUserSession();
    }
  } catch (error) {
    console.error('Logout API call failed:', error);
  }
};
