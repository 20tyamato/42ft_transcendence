import i18next from '@/config/i18n';
import { logger } from '@/core/Logger';
import { Page } from '@/core/Page';
import AuthLayout from '@/layouts/AuthLayout';
import { updateAvatar, updateLanguage, updateUserInfo } from '@/models/User/repository';
import { IUser } from '@/models/User/type';
import { setUserLanguage } from '@/utils/language';
import { updateAttribute, updatePlaceholder, updateText } from '@/utils/updateElements';

const updatePageContent = (): void => {
  updateText('.settings-title', i18next.t('userSettings'));
  updateText('label[for="avatarUpload"]', i18next.t('avatarImage'));
  updateAttribute('#avatarPreview', 'alt', i18next.t('avatarImagePreview'));
  updateText('label[for="displayNameInput"]', i18next.t('displayName'));
  updatePlaceholder('#displayNameInput', i18next.t('enterDisplayName'));
  updateText('label[for="emailInput"]', i18next.t('emailAddress'));
  updatePlaceholder('#emailInput', i18next.t('enterEmailAddress'));
  updateText('label[for="languageSelect"]', i18next.t('language'));
  updateText('button[type="submit"]', i18next.t('save'));
};

type SettingsElements = {
  avatarPreviewEl: HTMLImageElement;
  avatarUploadInput: HTMLInputElement;
  displayNameInput: HTMLInputElement;
  emailInput: HTMLInputElement;
  languageSelect: HTMLSelectElement;
  form: HTMLFormElement;
  responseMessage: HTMLElement | null;
};

const getSettingsElements = (): SettingsElements => ({
  avatarPreviewEl: document.getElementById('avatarPreview') as HTMLImageElement,
  avatarUploadInput: document.getElementById('avatarUpload') as HTMLInputElement,
  displayNameInput: document.getElementById('displayNameInput') as HTMLInputElement,
  emailInput: document.getElementById('emailInput') as HTMLInputElement,
  languageSelect: document.getElementById('languageSelect') as HTMLSelectElement,
  form: document.getElementById('userSettingsForm') as HTMLFormElement,
  responseMessage: document.getElementById('response-message'),
});

const populateUserData = (userData: IUser, elements: SettingsElements): void => {
  if (userData.avatar) {
    elements.avatarPreviewEl.src = userData.avatar;
  }
  if (userData.display_name) {
    elements.displayNameInput.value = userData.display_name;
  }
  if (userData.email) {
    elements.emailInput.value = userData.email;
  }
  if (userData.language) {
    elements.languageSelect.value = userData.language.toString();
  }
};

const registerAvatarPreview = (
  avatarUploadInput: HTMLInputElement,
  avatarPreviewEl: HTMLImageElement
): void => {
  avatarUploadInput.addEventListener('change', () => {
    if (!avatarUploadInput.files || avatarUploadInput.files.length === 0) return;
    const file = avatarUploadInput.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        avatarPreviewEl.src = e.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  });
};

const handleFormSubmit = async (event: Event, elements: SettingsElements) => {
  event.preventDefault();

  const { emailInput, displayNameInput, languageSelect, avatarUploadInput, responseMessage } =
    elements;
  const newEmail = emailInput.value.trim();
  const newDisplayName = displayNameInput.value.trim();
  const newLanguage = languageSelect.value;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(newEmail)) {
    setResponse(responseMessage, i18next.t('validEmail'), 'red');
    return;
  }

  if (!newDisplayName) {
    setResponse(responseMessage, i18next.t('validDisplayName'), 'red');
    return;
  }

  const validLanguages = ['en', 'ja', 'fr'];
  if (validLanguages.indexOf(newLanguage) === -1) {
    setResponse(responseMessage, i18next.t('validLanguage'), 'red');
    return;
  }

  try {
    await updateUserInfo(newEmail, newDisplayName);
    await updateLanguage(newLanguage);

    if (avatarUploadInput.files?.length) {
      const file = avatarUploadInput.files[0];
      await updateAvatar(file);
    }

    setResponse(responseMessage, i18next.t('settingsSaved'), 'green');
    window.location.href = '/profile';
  } catch (error) {
    logger.error('Error updating user info:', error);
    alert('Failed to update user information.');
  }
};

const setResponse = (el: HTMLElement | null, message: string, color: string): void => {
  if (el) {
    el.textContent = message;
    el.style.color = color;
  }
};

const SettingsUserPage = new Page({
  name: 'Settings/User',
  config: {
    layout: AuthLayout,
  },
  mounted: async ({ pg, user }): Promise<void> => {
    // DOM 要素の取得
    const elements = getSettingsElements();

    try {
      setUserLanguage(user.language, updatePageContent);
      populateUserData(user, elements);
    } catch (error) {
      logger.error('Error fetching user data:', error);
    }

    registerAvatarPreview(elements.avatarUploadInput, elements.avatarPreviewEl);

    elements.form.addEventListener('submit', (event) => handleFormSubmit(event, elements));
    pg.logger.info('SettingsUserPage mounted!');
  },
});

export default SettingsUserPage;
