import { Page } from '@/core/Page';
import backHomeLayout from '@/layouts/backhome/index';

interface IUserData {
  id: number;
  username: string;
  email: string;
  avatarUrl?: string;
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

    const userId = 1;
    const response = await fetch(`http://127.0.0.1:8000/api/users/${userId}`);
    const userData = (await response.json()) as IUserData;

    if (userData.avatarUrl && avatarPreviewEl) {
      avatarPreviewEl.src = userData.avatarUrl;
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

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const newEmail = emailInput.value.trim();

      let base64Avatar: string | null = null;
      if (avatarUploadInput.files && avatarUploadInput.files.length > 0) {
        const file = avatarUploadInput.files[0];
        base64Avatar = await fileToBase64(file);
      }

      const payload = {
        email: newEmail,
        avatar: base64Avatar,
      };

      const updateResponse = await fetch(`http://127.0.0.1:8000/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (updateResponse.ok) {
        window.location.href = '/profile';
      } else {
        alert('更新に失敗しました。');
      }
    });

    async function fileToBase64(file: File): Promise<string> {
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
    }
  },
});

export default SettingsUserPage;
