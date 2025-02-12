import { API_URL } from '@/config/config';

const token = localStorage.getItem('token');

const fetchUsers = async () => {
  const response = await fetch(`${API_URL}/api/users/`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user data');
  }
  return response.json();
};

const fetchCurrentUser = async () => {
  const response = await fetch(`${API_URL}/api/users/me/`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user data');
  }
  return response.json();
};

// アバター画像の更新（FormData を利用）
const updateAvatar = async (file: File) => {
  const formData = new FormData();
  formData.append('avatar', file);
  return fetch(`${API_URL}/api/users/me/avatar/`, {
    method: 'PATCH',
    headers: {
      Authorization: `Token ${token}`,
    },
    body: formData,
  });
};

// ユーザー情報（メール）の更新
const updateUserInfo = async (email: string) => {
  return fetch(`${API_URL}/api/users/me/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify({ email }),
  });
};
export { fetchCurrentUser, fetchUsers, updateAvatar, updateUserInfo };
