import { API_URL } from '@/config/config';
import i18next from '@/config/i18n';
import { fetcher } from '@/utils/fetcher';

export const fetchUsers = async () => {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const response = await fetch(`${API_URL}/api/users/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${token}`,
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch users:', await response.text());
      return;
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching users:', error);
  }
};

export const fetchUserAvatar = async (username: string): Promise<Blob | null> => {
  try {
    const response = await fetch(`${API_URL}/api/users/${username}/avatar/`);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch user avatar:', errorText);
      return null;
    }
    return await response.blob();
  } catch (error) {
    console.error('Error fetching user avatar:', error);
    return null;
  }
};

export const fetchUser = async (username: string) => {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const response = await fetch(`${API_URL}/api/users/${username}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${token}`,
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch user:', await response.text());
      return;
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching user:', error);
  }
};

export const fetchCurrentUser = async () => {
  const token = localStorage.getItem('token');
  if (!token) return;

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
  const token = localStorage.getItem('token');
  if (!token) return;

  const formData = new FormData();
  formData.append('avatar', file);

  try {
    const { data, ok } = await fetcher('/api/users/me/avatar/', {
      method: 'PATCH',
      headers: {
        Authorization: `Token ${token}`,
      },
      body: formData,
    });

    if (!ok) {
      throw new Error('Failed to update avatar');
    }
    return data;
  } catch (error) {
    console.error('Error updating avatar:', error);
  }
};

// ユーザー情報の更新
export const updateUserInfo = async (email: string, displayName: string) => {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const { data, ok } = await fetcher('/api/users/me/', {
      method: 'PATCH',
      headers: {
        Authorization: `Token ${token}`,
      },
      body: { email, displayName },
    });

    if (!ok) {
      throw new Error('Failed to update user info');
    }
    return data;
  } catch (error) {
    console.error('Error updating user info:', error);
  }
};

export const updateLanguage = async (language: string) => {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const response = await fetch(`${API_URL}/api/users/me/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({ language }),
    });

    if (!response.ok) {
      console.error('Language update failed:', await response.text());
    } else {
      localStorage.setItem('language', language);
      i18next.changeLanguage(i18next.language);
      console.log('Language updated successfully to ', i18next.language);
    }
  } catch (err) {
    console.error('Error updating language:', err);
  }
};

export const updateOnlineStatus = async (is_online: boolean) => {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const response = await fetch(`${API_URL}/api/users/me/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({ is_online }),
    });

    if (!response.ok) {
      console.error('Failed to update online status:', await response.text());
      return;
    }
    console.log('Online status updated successfully');
    return await response.json();
  } catch (error) {
    console.error('Error updating online status:', error);
  }
};
