import i18next from '@/config/i18n';
import { logger } from '@/core/Logger';

export const languageNames = {
  en: 'English',
  ja: '日本語',
  fr: 'Français',
} as const;

export const updateActiveLanguageButton = () => {
  const selectedLang = i18next.language;
  const btnEn = document.getElementById('lang-en');
  const btnJa = document.getElementById('lang-ja');
  const btnFr = document.getElementById('lang-fr');

  if (btnEn) btnEn.classList.toggle('active', selectedLang === 'en');
  if (btnJa) btnJa.classList.toggle('active', selectedLang === 'ja');
  if (btnFr) btnFr.classList.toggle('active', selectedLang === 'fr');

  localStorage.setItem('language', selectedLang);
};

export const setUserLanguage = (language: string, updatePageContent: () => void): void => {
  if (language) {
    document.documentElement.lang = language;
    i18next.changeLanguage(language, updatePageContent);
  } else {
    logger.error('Language not found in user data');
  }
};

export const changeLanguage = (language: string, updatePageContent: () => void): void => {
  i18next.changeLanguage(language, updatePageContent);
  updateActiveLanguageButton();
};

export const registerLanguageButton = (
  buttonId: string,
  language: string,
  updatePageContent: () => void
): void => {
  const button = document.getElementById(buttonId);
  if (!button) return;
  button.addEventListener('click', () => changeLanguage(language, updatePageContent));
};

export const registerLanguageSwitchers = (updatePageContent: () => void): void => {
  registerLanguageButton('lang-en', 'en', updatePageContent);
  registerLanguageButton('lang-ja', 'ja', updatePageContent);
  registerLanguageButton('lang-fr', 'fr', updatePageContent);
};
