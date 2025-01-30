import { Page } from '@/core/Page';
import backHomeLayout from '@/layouts/backhome/index';

interface IUserData {
  display_name: string;
  email: string;
  avatar?: string;
}

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

    const fetchUserData = async (): Promise<IUserData> => {
      const infoResponse = await fetch('http://127.0.0.1:8000/api/users/info/');
      const avatarResponse = await fetch('http://127.0.0.1:8000/api/users/avatar/');

      return {
        ...(await infoResponse.json()),
        avatar: (await avatarResponse.json()).avatar,
      };
    };

    const userData = await fetchUserData();
    if (userData.avatar && avatarPreviewEl) {
      avatarPreviewEl.src = userData.avatar;
    }
    if (userData.email && emailInput) {
      emailInput.value = userData.email;
    }

    avatarUploadInput.addEventListener('change', () => {
      if (!avatarUploadInput.files || avatarUploadInput.files.length === 0) return;
      const file = avatarUploadInput.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        if (avatarPreviewEl && e.target?.result) {
          avatarPreviewEl.src = e.target.result as string;
        }
      };
      reader.readAsDataURL(file);
    });

    const updateUserInfo = async (email: string) => {
      return fetch('http://127.0.0.1:8000/api/users/', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    };

    const updateAvatar = async (avatar: string) => {
      return fetch('http://127.0.0.1:8000/api/users/avatar/', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar }),
      });
    };

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
        alert('更新に失敗しました。');
      }
    });
  },
});

export default SettingsUserPage;
