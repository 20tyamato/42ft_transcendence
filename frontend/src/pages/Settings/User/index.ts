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

const updateText = (selector: string, text: string): void => {
  const el = document.querySelector(selector);
  if (el) el.textContent = text;
};

const updatePlaceholder = (selector: string, placeholder: string): void => {
  const el = document.querySelector(selector) as HTMLInputElement | null;
  if (el) el.placeholder = placeholder;
};

const updateAttribute = (selector: string, attribute: string, value: string): void => {
  const el = document.querySelector(selector);
  if (el) el.setAttribute(attribute, value);
};

/* ============================================================================
   DOM 要素取得・ユーザーデータ反映
   ============================================================================ */

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
  responseMessage: document.getElementById('response-message')
});

const populateUserData = (
  userData: {
    avatar?: string;
    display_name?: string;
    email?: string;
    language?: string;
  },
  elements: SettingsElements
): void => {
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
    elements.languageSelect.value = userData.language;
  }
};

/* ============================================================================
   イベントハンドラー
   ============================================================================ */

/**
 * アップロードした画像のプレビューを表示する
 */
const initAvatarPreview = (
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

/**
 * フォーム送信時のバリデーションと更新処理
 */
const handleFormSubmit = async (event: Event, elements: SettingsElements) => {
  event.preventDefault();

  const { emailInput, displayNameInput, languageSelect, avatarUploadInput, responseMessage } = elements;
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

  if (!['en', 'ja', 'fr'].includes(newLanguage)) {
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
    console.error('Error updating user info:', error);
    alert('Failed to update user information.');
  }
};

const setResponse = (el: HTMLElement | null, message: string, color: string): void => {
  if (el) {
    el.textContent = message;
    el.style.color = color;
  }
};

/* ============================================================================
   Page 定義
   ============================================================================ */

const SettingsUserPage = new Page({
  name: 'Settings/User',
  config: {
    layout: CommonLayout,
  },
  mounted: async () => {
    // DOM 要素の取得
    const elements = getSettingsElements();

    try {
      checkUserAccess();
      const userData = await fetchCurrentUser();
      setUserLanguage(userData.language, updatePageContent);
      populateUserData(userData, elements);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }

    // 画像アップロード時のプレビュー表示
    initAvatarPreview(elements.avatarUploadInput, elements.avatarPreviewEl);

    // フォーム送信イベントの登録
    elements.form.addEventListener('submit', (event) => handleFormSubmit(event, elements));
  },
});

export default SettingsUserPage;
