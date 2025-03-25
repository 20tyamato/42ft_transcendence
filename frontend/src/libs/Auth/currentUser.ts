import { fetchCurrentUser, updateOnlineStatus } from '@/models/User/repository';
import { IUser } from '@/models/User/type';
import { fetcher } from '@/utils/fetcher';
import { storage } from '../localStorage';

export type ICurrentUser = {
  token: string;
} & IUser;

/**
 * 認証チェック
 * @returns ユーザー情報
 */
export const checkAuthentication = async (): Promise<ICurrentUser> => {
  const token = storage.getUserToken();
  // 現在のパスを取得
  const currentPath = window.location.pathname;

  try {
    if (!token) throw new Error('Token does not exist.');
    const user = await fetchCurrentUser();
    return { token, ...user };
  } catch (error) {
    console.error('Failed to fetch current user:', error);
    storage.removeUserToken();

    // ホームページ('/')の場合はリダイレクトしない
    if (currentPath !== '/') {
      window.location.href = '/login';
    }

    // 認証されていないユーザー向けの基本情報を返す
    return {
      token: '',
      username: '',
      email: '',
      display_name: '',
      avatar: '',
      level: 1,
      language: 'en',
      is_online: false,
      total_matches: 0,
      wins: 0,
      losses: 0,
      tournament_wins: 0,
    };
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
