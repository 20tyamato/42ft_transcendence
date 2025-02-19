import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { checkUserAccess } from '@/models/User/auth';
import {
  fetchCurrentUser,
  updateAvatar,
  updateLanguage,
  updateUserInfo
} from '@/models/User/repository';
import { setUserLanguage } from '@/utils/language';
import i18next from 'i18next';

const updatePageContent = () => {
  const titleEl = document.querySelector('.settings-title');
  if (titleEl) titleEl.textContent = i18next.t('userSettings');

  const avatarLabel = document.querySelector('label[for="avatarUpload"]');
  if (avatarLabel) avatarLabel.textContent = i18next.t('avatarImage');

  const avatarPreviewEl = document.getElementById('avatarPreview') as HTMLImageElement;
  if (avatarPreviewEl) avatarPreviewEl.alt = i18next.t('avatarImagePreview');

  const displayNameLabel = document.querySelector('label[for="displayNameInput"]');
  if (displayNameLabel) displayNameLabel.textContent = i18next.t('displayName');

  const displayNameInput = document.getElementById('displayNameInput') as HTMLInputElement;
  if (displayNameInput) displayNameInput.placeholder = i18next.t('enterDisplayName');

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
    // HTML Elements
    const avatarPreviewEl = document.getElementById('avatarPreview') as HTMLImageElement;
    const avatarUploadInput = document.getElementById('avatarUpload') as HTMLInputElement;
    const displayNameInput = document.getElementById('displayNameInput') as HTMLInputElement;
    const emailInput = document.getElementById('emailInput') as HTMLInputElement;
    const languageSelect = document.getElementById('languageSelect') as HTMLSelectElement;
    const form = document.getElementById('userSettingsForm') as HTMLFormElement;
    const responseMessage = document.getElementById('response-message');

    try {
      checkUserAccess();
      const userData = await fetchCurrentUser();
      
      setUserLanguage(userData.language, updatePageContent);

      if (userData.avatar && avatarPreviewEl) {
        avatarPreviewEl.src = userData.avatar;
      }
      if (userData.display_name && displayNameInput) {
        displayNameInput.value = userData.display_name;
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

    // Preview uploaded avatar image
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

    // Form submission handling
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      try {
        const newEmail = emailInput.value.trim();
        const newDisplayName = displayNameInput.value.trim();
        const newLanguage = languageSelect.value;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
          if (responseMessage) {
            responseMessage.textContent = i18next.t('validEmail');
            responseMessage.style.color = 'red';
          }
          return;
        }

        if (!newDisplayName) {
          if (responseMessage) {
            responseMessage.textContent = i18next.t('validDisplayName');
            responseMessage.style.color = 'red';
          }
          return;
        }

        if (newLanguage !== 'en' && newLanguage !== 'ja' && newLanguage !== 'fr') {
          if (responseMessage) {
            responseMessage.textContent = i18next.t('validLanguage');
            responseMessage.style.color = 'red';
          }
          return;
        }

        await updateUserInfo(newEmail, newDisplayName);
        await updateLanguage(newLanguage);

        if (avatarUploadInput.files?.length) {
          const file = avatarUploadInput.files[0];
          await updateAvatar(file);
        }
        if (responseMessage) {
          responseMessage.textContent = i18next.t('settingsSaved');
          responseMessage.style.color = 'green';
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
