import { API_URL } from '@/config/config';
import i18next from '@/config/i18n';
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { updateActiveLanguageButton } from '@/models/Lang/repository';
import { initLanguageSwitchers } from '@/utils/language';

const setText = (selector: string, translationKey: string, useInnerHTML = false): void => {
  const element = document.querySelector(selector);
  if (element) {
    if (useInnerHTML) {
      element.innerHTML = i18next.t(translationKey);
    } else {
      element.textContent = i18next.t(translationKey);
    }
  }
};

const updatePageContent = (): void => {
  setText('.register-container h2', 'register');
  setText('label[for="username"]', 'username');
  setText('label[for="email"]', 'emailAddress');
  setText('label[for="displayName"]', 'displayName');
  setText('label[for="password"]', 'password');
  setText('label[for="password_confirm"]', 'confirmPassword');
  setText('button.btn.btn-primary', 'register');
  setText('.centered-text', 'loginPrompt', true);
};

const initTogglePassword = (toggleBtnId: string, fieldId: string, iconId: string): void => {
  const toggleBtn = document.getElementById(toggleBtnId);
  const passwordField = document.getElementById(fieldId) as HTMLInputElement | null;
  const passwordIcon = document.getElementById(iconId);
  if (toggleBtn && passwordField && passwordIcon) {
    toggleBtn.addEventListener('click', () => {
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

const handleRegistrationSubmit = async (
  form: HTMLFormElement,
  responseMessage: HTMLElement
): Promise<void> => {
  const formData = new FormData(form);
  const username = formData.get('username') as string;
  const email = formData.get('email') as string;
  const displayName = formData.get('displayName') as string;
  const password = formData.get('password') as string;
  const passwordConfirm = formData.get('password_confirm') as string;

  // 入力必須チェック
  if (!username || !email || !displayName || !password || !passwordConfirm) {
    responseMessage.textContent = i18next.t('allFieldsRequired');
    responseMessage.style.color = 'red';
    return;
  }

  // メールアドレスの形式チェック
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    responseMessage.textContent = i18next.t('validEmail');
    responseMessage.style.color = 'red';
    return;
  }

  // パスワード一致チェック
  if (password !== passwordConfirm) {
    responseMessage.textContent = i18next.t('passwordsDoNotMatch');
    responseMessage.style.color = 'red';
    return;
  }

  const userData = {
    username: username,
    email: email,
    display_name: displayName,
    password: password,
  };

  try {
    const response = await fetch(`${API_URL}/api/users/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(userData),
    });

    if (response.ok) {
      const result = await response.json();
      localStorage.setItem('token', result.token);
      localStorage.setItem('username', result.username);
      responseMessage.textContent = i18next.t('registerSuccess');
      responseMessage.style.color = 'green';
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
    } else {
      const error = await response.json();
      let errorMessage = i18next.t('somethingWentWrong');
      if (error.username) {
        errorMessage = i18next.t('usernameExists');
      } else if (error.display_name) {
        errorMessage = i18next.t('displayNameExists');
      } else if (error.email) {
        errorMessage = i18next.t('emailExists');
      } else if (error.password) {
        errorMessage = error.password[0];
      } else if (error.non_field_errors) {
        errorMessage = error.non_field_errors[0];
      }
      responseMessage.textContent = errorMessage;
      responseMessage.style.color = 'red';
    }
  } catch (error) {
    console.error(error);
    responseMessage.textContent = i18next.t('unexpectedError');
    responseMessage.style.color = 'red';
  }
};

const initRegisterForm = (): void => {
  const form = document.getElementById('register-form') as HTMLFormElement | null;
  const responseMessage = document.getElementById('response-message');
  if (!form || !responseMessage) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    await handleRegistrationSubmit(form, responseMessage);
  });
};

const RegisterPage = new Page({
  name: 'Register',
  config: { layout: CommonLayout },
  mounted: async ({ pg }: { pg: Page }) => {
    updatePageContent();
    updateActiveLanguageButton();
    initLanguageSwitchers(updatePageContent);

    initRegisterForm();

    initTogglePassword('toggle-password', 'password', 'password-icon');
    initTogglePassword('toggle-password-confirm', 'password-confirm', 'password-confirm-icon');

    pg.logger.info('RegisterPage mounted!');
  },
});

export default RegisterPage;
