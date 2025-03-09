import { fetchCurrentUser, updateOnlineStatus } from '@/models/User/repository';
import { IUser } from '@/models/User/type';
import { storage } from '../localStorage';
import { fetcher } from '@/utils/fetcher';

export type ICurrentUser = {
  token: string;
} & IUser;

/**
 * 認証チェック
 * @returns ユーザー情報
 */
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

/**
 * 現在のユーザー情報を取得
 * @returns ユーザー情報
 */
export const useCurrentUser = async (): Promise<ICurrentUser> => {
  return await checkAuthentication();
};

/**
 * ログインチェック
 * @returns ログイン状態
 */
export const isLoggedIn = async (): Promise<boolean> => {
  try {
    await checkAuthentication();
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * ログアウト
 */
export const logout = async (): Promise<void> => {
  const token = storage.getUserToken();
  if (!token) return;

  try {
    await updateOnlineStatus(false);

    await fetcher('/api/logout/', {
      method: 'POST',
      headers: {
        Authorization: `Token ${token}`,
      },
    });
  } catch (error) {
    console.error('Failed to logout:', error);
  } finally {
    storage.removeUserToken();
  }
};
