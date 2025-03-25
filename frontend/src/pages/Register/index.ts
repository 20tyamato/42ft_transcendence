import i18next from '@/config/i18n';
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { storage } from '@/libs/localStorage';
import { fetcherGuest } from '@/utils/fetcher';
import { validateRegistrationForm } from '@/utils/form';
import { registerLanguageSwitchers, updateActiveLanguageButton } from '@/utils/language';
import { registerTogglePassword } from '@/utils/togglePassword';
import { updateInnerHTML, updateText } from '@/utils/updateElements';

const handleRegistrationSubmit = async (
  form: HTMLFormElement,
  responseMessage: HTMLElement
): Promise<void> => {
  const formData = new FormData(form);

  // バリデーションチェック
  const validationError = validateRegistrationForm(formData);
  if (validationError) {
    responseMessage.textContent = validationError;
    responseMessage.style.color = 'red';
    return;
  }

  const userData = {
    username: formData.get('username') as string,
    email: formData.get('email') as string,
    display_name: formData.get('displayName') as string,
    password: formData.get('password') as string,
  };

  try {
    const { data, ok } = await fetcherGuest(`/api/users/`, {
      method: 'POST',
      body: userData,
    });

    if (ok) {
      storage.setUserToken(data.token);

      responseMessage.textContent = i18next.t('registerSuccess');
      responseMessage.style.color = 'green';
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
    } else {
      const error = data;
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

const updatePageContent = (): void => {
  updateText('title', i18next.t('register'));
  updateText('.register-container h2', i18next.t('register'));
  updateText('label[for="username"]', i18next.t('username'));
  updateText('label[for="email"]', i18next.t('emailAddress'));
  updateText('label[for="displayName"]', i18next.t('displayName'));
  updateText('label[for="password"]', i18next.t('password'));
  updateText('label[for="password_confirm"]', i18next.t('confirmPassword'));
  updateText('button.btn.btn-primary', i18next.t('register'));
  updateInnerHTML('.centered-text', i18next.t('loginPrompt'));
};

const RegisterPage = new Page({
  name: 'Register',
  config: { layout: CommonLayout },
  mounted: async ({ pg }): Promise<void> => {
    updatePageContent();
    updateActiveLanguageButton();

    registerLanguageSwitchers(updatePageContent);
    initRegisterForm();

    registerTogglePassword('toggle-password', 'password', 'password-icon');
    registerTogglePassword('toggle-password-confirm', 'password-confirm', 'password-confirm-icon');

    pg.logger.info('RegisterPage mounted!');
  },
});

export default RegisterPage;
