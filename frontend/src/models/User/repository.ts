import { API_URL } from '@/config/config';
import i18next from 'i18next';

interface IUserData {
  display_name: string;
  email: string;
  avatar?: string;
  language?: string;
}

const fetchUsers = async () => {
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

const fetchCurrentUser = async () => {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const response = await fetch(`${API_URL}/api/users/me/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${token}`,
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch current user:', await response.text());
      return;
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching current user:', error);
  }
};

// アバター画像の更新（FormData を利用）
const updateAvatar = async (file: File) => {
  const token = localStorage.getItem('token');
  if (!token) return;

  const formData = new FormData();
  formData.append('avatar', file);

  try {
    const response = await fetch(`${API_URL}/api/users/me/avatar/`, {
      method: 'PATCH',
      headers: {
        Authorization: `Token ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      console.error('Failed to update avatar:', await response.text());
      return;
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating avatar:', error);
  }
};

// ユーザー情報（メールと表示名）の更新
const updateUserInfo = async (email: string, displayName: string) => {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const response = await fetch(`${API_URL}/api/users/me/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({ email, displayName }),
    });

    if (!response.ok) {
      console.error('Failed to update user info:', await response.text());
      return;
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating user info:', error);
  }
};

const updateLanguage = async (language: string) => {
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

const updateOnlineStatus = async (is_online: boolean) => {
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

export {
  fetchCurrentUser,
  fetchUsers,
  IUserData,
  updateAvatar,
  updateLanguage,
  updateOnlineStatus,
  updateUserInfo,
};
