import { fetchCurrentUser } from '@/models/User/repository';
import { IUser } from '@/models/User/type';

export type ICurrentUser = {
  token: string;
} & IUser;

export const useCurrentUser = async (): Promise<ICurrentUser> => {
  const token = localStorage.getItem('token');

  if (!token) {
    window.location.href = '/login';
    throw new Error('Token does not exist, redirected to login page.');
  }
  try {
    const user = await fetchCurrentUser();
    return { token, ...user };
  } catch (error) {
    console.error('Error fetching current user:', error);
    window.location.href = '/login';
    throw new Error('Token does not exist, redirected to login page.');
  }
};
