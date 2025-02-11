import { API_URL } from '@/config/config';
import i18next from '@/config/i18n';
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';
import { updateActiveLanguageButton } from '@/models/Lang/repository';

const updateRegisterContent = () => {
  const loginTitle = document.querySelector('.register-container h2');
  if (loginTitle) loginTitle.textContent = i18next.t('register');

  const usernameLabel = document.querySelector('label[for="username"]');
  if (usernameLabel) usernameLabel.textContent = i18next.t('username');

  const emailLabel = document.querySelector('label[for="email"]');
  if (emailLabel) emailLabel.textContent = i18next.t('email');

  const displayNameLabel = document.querySelector('label[for="display_name"]');
  if (displayNameLabel) displayNameLabel.textContent = i18next.t('displayName');

  const passwordLabel = document.querySelector('label[for="password"]');
  if (passwordLabel) passwordLabel.textContent = i18next.t('password');

  const loginBtn = document.querySelector('button.btn.btn-primary');
  if (loginBtn) loginBtn.textContent = i18next.t('register');

  const centeredText = document.querySelector('.centered-text');
  if (centeredText) centeredText.innerHTML = i18next.t('loginPrompt');
};

const RegisterPage = new Page({
  name: 'Register',
  config: {
    layout: CommonLayout,
  },
  mounted: async () => {
    updateRegisterContent();
    updateActiveLanguageButton();

    const btnEn = document.getElementById('lang-en');
    const btnJa = document.getElementById('lang-ja');
    const btnFr = document.getElementById('lang-fr');
    btnEn?.addEventListener('click', () => {
      i18next.changeLanguage('en', updateRegisterContent);
      updateActiveLanguageButton();
    });
    btnJa?.addEventListener('click', () => {
      i18next.changeLanguage('ja', updateRegisterContent);
      updateActiveLanguageButton();
    });
    btnFr?.addEventListener('click', () => {
      i18next.changeLanguage('fr', updateRegisterContent);
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
      const display_name = formData.get('display_name') as string;
      const password = formData.get('password') as string;
      const password_confirm = formData.get('password_confirm') as string;

      if (!username || !email || !display_name || !password || !password_confirm) {
        if (responseMessage) {
          responseMessage.textContent = 'All fields are required';
          responseMessage.style.color = 'red';
        }
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        if (responseMessage) {
          responseMessage.textContent = 'Please enter a valid email address';
          responseMessage.style.color = 'red';
        }
        return;
      }

      if (password !== password_confirm) {
        if (responseMessage) {
          responseMessage.textContent = 'Passwords do not match';
          responseMessage.style.color = 'red';
        }
        return;
      }

      const userData = {
        username,
        email,
        display_name,
        password,
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
          responseMessage!.textContent = 'Registration successful!';
          responseMessage!.style.color = 'green';
          console.log(result);
          window.location.href = '/login';
        } else {
          const error = await response.json();
          responseMessage!.textContent = `Error: ${error.message || 'Something went wrong'}`;
          responseMessage!.style.color = 'red';
        }
      } catch (error) {
        console.error(error);
        responseMessage!.textContent = 'An unexpected error occurred.';
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
