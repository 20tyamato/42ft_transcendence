import { Page } from '@/core/Page';
import backHomeLayout from '@/layouts/backhome/index';

interface IUserData {
  display_name: string;
  email: string;
  avatar?: string;
}

// 共通のfetch設定
const fetchWithAuth = (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  console.log('Token format:', token); // トークンの形式を確認

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Token ${token}`, // Bearerから Tokenに変更してテスト
      'Content-Type': 'application/json',
    },
  });
};

const SettingsUserPage = new Page({
  name: 'Settings/User',
  config: {
    layout: backHomeLayout,
  },
  mounted: async () => {
    const avatarPreviewEl = document.getElementById('avatarPreview') as HTMLImageElement;
    const avatarUploadInput = document.getElementById('avatarUpload') as HTMLInputElement;
    const emailInput = document.getElementById('emailInput') as HTMLInputElement;
    const form = document.getElementById('userSettingsForm') as HTMLFormElement;

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      return;
    }

    // ユーザー情報の取得
    const fetchUserData = async (): Promise<IUserData> => {
      const infoResponse = await fetchWithAuth('http://127.0.0.1:8000/api/users/info/');
      const avatarResponse = await fetchWithAuth('http://127.0.0.1:8000/api/users/avatar/');

      if (!infoResponse.ok || !avatarResponse.ok) {
        throw new Error('Failed to fetch user data');
      }

      return {
        ...(await infoResponse.json()),
        avatar: (await avatarResponse.json()).avatar,
      };
    };

    // アバタープレビュー
    avatarUploadInput.addEventListener('change', () => {
      if (!avatarUploadInput.files?.length) return;
      const file = avatarUploadInput.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        if (avatarPreviewEl && e.target?.result) {
          avatarPreviewEl.src = e.target.result as string;
        }
      };
      reader.readAsDataURL(file);
    });

    // ユーザー情報の更新
    const updateUserInfo = async (email: string) => {
      const response = await fetchWithAuth('http://127.0.0.1:8000/api/users/info/', {
        method: 'PUT',
        body: JSON.stringify({ email, display_name: 'test' }), // display_nameも必要
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Update user info error:', errorData);
        throw new Error(`Failed to update user info: ${JSON.stringify(errorData)}`);
      }
      return response.json();
    };

    // アバター更新
    const updateAvatar = async (avatar: string) => {
      const response = await fetchWithAuth('http://127.0.0.1:8000/api/users/avatar/', {
        method: 'PUT',
        body: JSON.stringify({ avatar }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Update avatar error:', errorData);
        throw new Error(`Failed to update avatar: ${JSON.stringify(errorData)}`);
      }
      return response.json();
    };

    // ファイルをBase64に変換
    const fileToBase64 = async (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            resolve(e.target.result as string);
          } else {
            reject('FileReader error');
          }
        };
        reader.onerror = () => reject('FileReader error');
        reader.readAsDataURL(file);
      });
    };

    try {
      // 初期データのセット
      const userData = await fetchUserData();
      if (userData.avatar && avatarPreviewEl) {
        avatarPreviewEl.src = userData.avatar;
      }
      if (userData.email && emailInput) {
        emailInput.value = userData.email;
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      alert('ユーザー情報の取得に失敗しました。');
    }

    // フォーム送信
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      try {
        const newEmail = emailInput.value.trim();
        await updateUserInfo(newEmail);

        if (avatarUploadInput.files?.length) {
          const base64Avatar = await fileToBase64(avatarUploadInput.files[0]);
          await updateAvatar(base64Avatar);
        }

        window.location.href = '/profile';
      } catch (error) {
        console.error('Update failed:', error);
        alert('更新に失敗しました。');
      }
    });
  },
});

export default SettingsUserPage;
