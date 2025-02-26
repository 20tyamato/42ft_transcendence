import { API_URL } from '@/config/config';
import { fetchCurrentUser, updateOnlineStatus } from '@/models/User/repository';

export function checkUserAccess(): string {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login';
    throw new Error('Token does not exist, redirected to login page.');
  }
  try {
    fetchCurrentUser();
  } catch (error) {
    console.error('Failed to fetch current user:', error);
    window.location.href = '/login';
  }
  updateOnlineStatus(true);
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
  await updateOnlineStatus(false);
  console.log('token:', token);

  const url = `${API_URL}/api/logout/`;
  const data = JSON.stringify({});

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${token}`,
      },
      body: data,
      credentials: 'include',
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
