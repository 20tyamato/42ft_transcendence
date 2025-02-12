import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { checkUserAccess } from '@/models/User/auth';
import {
  fetchCurrentUser,
  updateAvatar,
  updateLanguage,
  updateUserInfo,
} from '@/models/User/repository';

interface IUserData {
  display_name: string;
  email: string;
  avatar?: string;
  language?: string;
}

const SettingsUserPage = new Page({
  name: 'Settings/User',
  config: {
    layout: CommonLayout,
  },
  mounted: async () => {
    checkUserAccess();
    // HTML Elements
    const avatarPreviewEl = document.getElementById('avatarPreview') as HTMLImageElement;
    const avatarUploadInput = document.getElementById('avatarUpload') as HTMLInputElement;
    const emailInput = document.getElementById('emailInput') as HTMLInputElement;
    const languageSelect = document.getElementById('languageSelect') as HTMLSelectElement;
    const form = document.getElementById('userSettingsForm') as HTMLFormElement;

    try {
      const userData: IUserData = await fetchCurrentUser();

      if (userData.avatar && avatarPreviewEl) {
        avatarPreviewEl.src = userData.avatar;
      }
      if (userData.email && emailInput) {
        emailInput.value = userData.email;
      }
      if (userData.language && languageSelect) {
        languageSelect.value = userData.language;
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }

    // アップロードした画像をプレビュー表示
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

    // フォーム送信時の処理
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      try {
        const newEmail = emailInput.value.trim();
        const newLanguage = languageSelect.value;
        await updateUserInfo(newEmail);
        await updateLanguage(newLanguage);

        if (avatarUploadInput.files?.length) {
          const file = avatarUploadInput.files[0];
          await updateAvatar(file);
        }

        window.location.href = '/profile';
      } catch (error) {
        console.error('Error updating user info:', error);
        alert('Failed to update user information.');
      }
    });
  },
});

export default SettingsUserPage;
