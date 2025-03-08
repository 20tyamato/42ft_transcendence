import { Layout } from '@/core/Layout';
import { storage } from '@/libs/localStorage';
import { fetchCurrentUser, updateOnlineStatus } from '@/models/User/repository';

export async function checkUserAccess(): Promise<string> {
  const token = storage.getUserToken();

  try {
    if (!token) throw new Error('Token does not exist, redirected to login page.');
    const user = await fetchCurrentUser();
    updateOnlineStatus(true);
    return token;
  } catch (error) {
    console.error('Failed to fetch current user:', error);
    window.location.href = '/login';
    throw new Error('Token does not exist, redirected to login page.');
  }
}

const AuthLayout = new Layout({
  name: 'AuthLayout',
  beforeMounted: async () => {
    await checkUserAccess();
  },
});

export default AuthLayout;
