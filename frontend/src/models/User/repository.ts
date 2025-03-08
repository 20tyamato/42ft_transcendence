import { API_URL } from '@/config/config';
import i18next from '@/config/i18n';
import { fetcher } from '@/utils/fetcher';

export const fetchUsers = async () => {
  try {
    const { data } = await fetcher('/api/users/', {
      method: 'GET',
    });

    return data;
  } catch (error) {
    console.error('Error fetching users:', error);
  }
};

export const fetchUserAvatar = async (username: string): Promise<Blob | null> => {
  try {
    const { data } = await fetcher(`/api/users/${username}/avatar/`, {
      method: 'GET',
    });
    return data;
  } catch (error) {
    console.error('Error fetching user avatar:', error);
    return null;
  }
};

export const fetchUser = async (username: string) => {
  try {
    const { data } = await fetcher(`/api/users/${username}/`, {
      method: 'GET',
    });
    return data;
  } catch (error) {
    console.error('Error fetching user:', error);
  }
};

export const fetchCurrentUser = async () => {
  try {
    const { data } = await fetcher('/api/users/me/', {
      method: 'GET',
    });

    return data;
  } catch (error) {
    console.error('Error fetching current user:', error);
  }
};

// アバター画像の更新
export const updateAvatar = async (file: File) => {
  const formData = new FormData();
  formData.append('avatar', file);

  try {
    const { data } = await fetcher('/api/users/me/avatar/', {
      method: 'PATCH',
      body: formData,
    });

    return data;
  } catch (error) {
    console.error('Error updating avatar:', error);
  }
};

// ユーザー情報の更新
export const updateUserInfo = async (email: string, displayName: string) => {
  try {
    const { data } = await fetcher('/api/users/me/', {
      method: 'PATCH',
      body: { email, displayName },
    });

    return data;
  } catch (error) {
    console.error('Error updating user info:', error);
  }
};

export const updateLanguage = async (language: string) => {
  try {
    await fetcher('/api/users/me/', {
      method: 'PATCH',
      body: { language },
    });

    localStorage.setItem('language', language);
    i18next.changeLanguage(i18next.language);
    console.log('Language updated successfully to ', i18next.language);
  } catch (err) {
    console.error('Error updating language:', err);
  }
};

export const updateOnlineStatus = async (is_online: boolean) => {
  try {
    const { data } = await fetcher('/api/users/me/', {
      method: 'PATCH',
      body: { is_online },
    });

    console.log('Online status updated successfully');
    return data;
  } catch (error) {
    console.error('Error updating online status:', error);
  }
};
