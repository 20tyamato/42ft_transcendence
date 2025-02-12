import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { checkUserAccess } from '@/models/User/auth';
import {
  fetchCurrentUser,
  updateAvatar,
  updateLanguage,
  updateUserInfo,
} from '@/models/User/repository';
import i18next from 'i18next';

interface IUserData {
  display_name: string;
  email: string;
  avatar?: string;
  language?: string;
}

const updateContent = () => {
  const titleEl = document.querySelector('.settings-title');
  if (titleEl) titleEl.textContent = i18next.t('userSettings');

  const avatarLabel = document.querySelector('label[for="avatarUpload"]');
  if (avatarLabel) avatarLabel.textContent = i18next.t('avatarImage');

  const avatarPreviewEl = document.getElementById('avatarPreview') as HTMLImageElement;
  if (avatarPreviewEl) avatarPreviewEl.alt = i18next.t('avatarImagePreview');

  const emailLabel = document.querySelector('label[for="emailInput"]');
  if (emailLabel) emailLabel.textContent = i18next.t('emailAddress');

  const emailInput = document.getElementById('emailInput') as HTMLInputElement;
  if (emailInput) emailInput.placeholder = i18next.t('enterEmailAddress');

  const languageLabel = document.querySelector('label[for="languageSelect"]');
  if (languageLabel) languageLabel.textContent = i18next.t('language');

  const saveButton = document.querySelector('button[type="submit"]');
  if (saveButton) saveButton.textContent = i18next.t('save');
};

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
      if (userData.language) {
        document.documentElement.lang = userData.language;
        i18next.changeLanguage(userData.language, updateContent);
      }

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
