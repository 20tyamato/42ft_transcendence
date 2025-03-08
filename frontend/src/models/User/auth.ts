import { fetcher } from '@/utils/fetcher';
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

  try {
    const { ok } = await fetcher('/api/logout/', {
      method: 'POST',
      headers: {
        Authorization: `Token ${token}`,
      },
    });

    if (ok) {
      localStorage.clear();
    }
  } catch (error) {
    console.error('Logout API call failed:', error);
  }
};
