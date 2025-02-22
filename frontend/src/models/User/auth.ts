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

export const executeLogout = async (): Promise<void> => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.warn('No token found in local storage. Skipping logout.');
    return;
  }
  console.log('token:', token);

  const baseUrl = `${API_URL}/api/logout/`;
  const data = JSON.stringify({});

  try {
    updateOnlineStatus(false);

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${token}`,
      },
      body: data,
      credentials: 'include',
      keepalive: true,
    });
    if (response.ok) {
      localStorage.clear();
    } else {
      console.error('Logout API call failed with status:', response.status);
    }
  } catch (error) {
    console.error('Logout API call failed:', error);
  }
};
