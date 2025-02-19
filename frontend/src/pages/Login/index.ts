import { API_URL } from '@/config/config';
import i18next from '@/config/i18n';
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { updateLanguage, updateOnlineStatus } from '@/models/User/repository';
import { initLanguageSwitchers, updateActiveLanguageButton } from '@/utils/language';
import { updateInnerHTML, updateText } from '@/utils/updateElements';

const updatePageContent = (): void => {
  updateText('title', i18next.t('login'));
  updateText('.login-container h1', i18next.t('login'));
  updateText('label[for="username"]', i18next.t('username'));
  updateText('label[for="password"]', i18next.t('password'));
  updateText('button.btn.btn-primary', i18next.t('login'));
  updateInnerHTML('.centered-text', i18next.t('registerPrompt'));
};

const handleLoginSubmit = async (
  form: HTMLFormElement,
  responseMessage: HTMLElement
): Promise<void> => {
  const formData = new FormData(form);
  const loginData = {
    username: formData.get('username'),
    password: formData.get('password'),
  };

  try {
    const response = await fetch(`${API_URL}/api/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(loginData),
    });

    if (response.ok) {
      const result = await response.json();
      localStorage.setItem('token', result.token);
      localStorage.setItem('username', result.username);
      i18next.changeLanguage(i18next.language);
      updateLanguage(i18next.language);
      updateOnlineStatus(true);

      responseMessage.textContent = i18next.t('loginSuccess');
      responseMessage.style.color = 'green';

      setTimeout(() => {
        window.location.href = '/modes';
      }, 1000);
    } else {
      const error = await response.json();
      responseMessage.textContent = i18next.t('errorMessage', {
        error: error.message || i18next.t('invalidCredentials'),
      });
      responseMessage.style.color = 'red';
    }
  } catch (error) {
    console.error(error);
    responseMessage.textContent = i18next.t('unexpectedError');
    responseMessage.style.color = 'red';
  }
};

const initLoginForm = (): void => {
  const form = document.getElementById('login-form') as HTMLFormElement | null;
  const responseMessage = document.getElementById('response-message');
  if (!form || !responseMessage) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    await handleLoginSubmit(form, responseMessage);
  });
};

const initTogglePassword = (): void => {
  const togglePasswordBtn = document.getElementById('toggle-password');
  const passwordField = document.getElementById('password') as HTMLInputElement | null;
  const passwordIcon = document.getElementById('password-icon');

  if (togglePasswordBtn && passwordField && passwordIcon) {
    togglePasswordBtn.addEventListener('click', () => {
      if (passwordField.type === 'password') {
        passwordField.type = 'text';
        passwordIcon.classList.remove('fa-eye');
        passwordIcon.classList.add('fa-eye-slash');
      } else {
        passwordField.type = 'password';
        passwordIcon.classList.remove('fa-eye-slash');
        passwordIcon.classList.add('fa-eye');
      }
    });
  }
};

const LoginPage = new Page({
  name: 'Login',
  config: { layout: CommonLayout },
  mounted: async ({ pg }: { pg: Page }) => {
    updatePageContent();
    updateActiveLanguageButton();
    initLanguageSwitchers(updatePageContent);

    initLoginForm();
    initTogglePassword();

    pg.logger.info('LoginPage mounted!');
  },
});

export default LoginPage;
