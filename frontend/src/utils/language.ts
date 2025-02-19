import i18next from '@/config/i18n';
import { updateActiveLanguageButton } from '@/models/Lang/repository';

export const setUserLanguage = (language: string, updatePageContent: () => void): void => {
  if (language) {
    document.documentElement.lang = language;
    i18next.changeLanguage(language, updatePageContent);
  } else {
    console.error('Language not found in user data');
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

export const initLanguageSwitchers = (updatePageContent: () => void): void => {
  registerLanguageButton('lang-en', 'en', updatePageContent);
  registerLanguageButton('lang-ja', 'ja', updatePageContent);
  registerLanguageButton('lang-fr', 'fr', updatePageContent);
};
