import { API_URL } from '@/config/config';
import i18next from '@/config/i18n';
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { updateActiveLanguageButton } from '@/models/Lang/repository';

const updatePageContent = () => {
  const loginTitle = document.querySelector('.register-container h2');
  if (loginTitle) loginTitle.textContent = i18next.t('register');

  const usernameLabel = document.querySelector('label[for="username"]');
  if (usernameLabel) usernameLabel.textContent = i18next.t('username');

  const emailLabel = document.querySelector('label[for="email"]');
  if (emailLabel) emailLabel.textContent = i18next.t('emailAddress');

  const displayNameLabel = document.querySelector('label[for="displayName"]');
  if (displayNameLabel) displayNameLabel.textContent = i18next.t('displayName');

  const passwordLabel = document.querySelector('label[for="password"]');
  if (passwordLabel) passwordLabel.textContent = i18next.t('password');

  const passwordConfirmLabel = document.querySelector('label[for="password_confirm"]');
  if (passwordConfirmLabel) passwordConfirmLabel.textContent = i18next.t('confirmPassword');

  const registerBtn = document.querySelector('button.btn.btn-primary');
  if (registerBtn) registerBtn.textContent = i18next.t('register');

  const centeredText = document.querySelector('.centered-text');
  if (centeredText) centeredText.innerHTML = i18next.t('loginPrompt');
};

const RegisterPage = new Page({
  name: 'Register',
  config: {
    layout: CommonLayout,
  },
  mounted: async () => {
    updatePageContent();
    updateActiveLanguageButton();

    const btnEn = document.getElementById('lang-en');
    const btnJa = document.getElementById('lang-ja');
    const btnFr = document.getElementById('lang-fr');
    btnEn?.addEventListener('click', () => {
      i18next.changeLanguage('en', updatePageContent);
      updateActiveLanguageButton();
    });
    btnJa?.addEventListener('click', () => {
      i18next.changeLanguage('ja', updatePageContent);
      updateActiveLanguageButton();
    });
    btnFr?.addEventListener('click', () => {
      i18next.changeLanguage('fr', updatePageContent);
      updateActiveLanguageButton();
    });
    const form = document.getElementById('register-form') as HTMLFormElement | null;
    const responseMessage = document.getElementById('response-message');

    if (!form) return;

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const username = formData.get('username') as string;
      const email = formData.get('email') as string;
      const displayName = formData.get('displayName') as string;
      const password = formData.get('password') as string;
      const password_confirm = formData.get('password_confirm') as string;

      if (!username || !email || !displayName || !password || !password_confirm) {
        if (responseMessage) {
          responseMessage.textContent = i18next.t('allFieldsRequired');
          responseMessage.style.color = 'red';
        }
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        if (responseMessage) {
          responseMessage.textContent = i18next.t('validEmail');
          responseMessage.style.color = 'red';
        }
        return;
      }

      if (password !== password_confirm) {
        if (responseMessage) {
          responseMessage.textContent = i18next.t('passwordsDoNotMatch');
          responseMessage.style.color = 'red';
        }
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
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(userData),
        });

        if (response.ok) {
          const result = await response.json();
          localStorage.setItem('token', result.token);
          localStorage.setItem('username', result.username);
          responseMessage!.textContent = i18next.t('registerSuccess');
          responseMessage!.style.color = 'green';

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

          responseMessage!.textContent = errorMessage;
          responseMessage!.style.color = 'red';
        }
      } catch (error) {
        console.error(error);
        responseMessage!.textContent = i18next.t('unexpectedError');
        responseMessage!.style.color = 'red';
      }
    });

    const togglePasswordBtn = document.getElementById('toggle-password');
    const passwordField = document.getElementById('password') as HTMLInputElement;
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

    const togglePasswordConfirmBtn = document.getElementById('toggle-password-confirm');
    const passwordConfirmField = document.getElementById('password-confirm') as HTMLInputElement;
    const passwordConfirmIcon = document.getElementById('password-confirm-icon');

    if (togglePasswordConfirmBtn && passwordConfirmField && passwordConfirmIcon) {
      togglePasswordConfirmBtn.addEventListener('click', () => {
        if (passwordConfirmField.type === 'password') {
          passwordConfirmField.type = 'text';
          passwordConfirmIcon.classList.remove('fa-eye');
          passwordConfirmIcon.classList.add('fa-eye-slash');
        } else {
          passwordConfirmField.type = 'password';
          passwordConfirmIcon.classList.remove('fa-eye-slash');
          passwordConfirmIcon.classList.add('fa-eye');
        }
      });
    }
  },
});

export default RegisterPage;
