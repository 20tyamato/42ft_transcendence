import { fetchCurrentUser } from '@/models/User/repository';
import { IUser } from '@/models/User/type';
import { storage } from '../localStorage';

export type ICurrentUser = {
  token: string;
} & IUser;

export const checkAuthentication = async (): Promise<ICurrentUser> => {
  const token = storage.getUserToken();

  try {
    if (!token) throw new Error('Token does not exist, redirected to login page.');
    const user = await fetchCurrentUser();
    return { token, ...user };
  } catch (error) {
    console.error('Failed to fetch current user:', error);
    storage.removeUserToken();
    window.location.href = '/login';
    throw new Error('Token does not exist, redirected to login page.');
  }
};

export const useCurrentUser = async (): Promise<ICurrentUser> => {
  return await checkAuthentication();
};
