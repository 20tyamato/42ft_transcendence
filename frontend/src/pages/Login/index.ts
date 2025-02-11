import { API_URL } from '@/config/config';
import i18next from '@/config/i18n'; // 初期化済みの i18next をインポート
import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';

const LoginPage = new Page({
  name: 'Login',
  config: {
    layout: CommonLayout,
  },
  mounted: async () => {
    // ----- 翻訳テキストで DOM の更新 -----
    const loginTitle = document.querySelector('.login-container h1');
    if (loginTitle) {
      loginTitle.textContent = i18next.t('login');
    }

    const usernameLabel = document.querySelector('label[for="username"]');
    if (usernameLabel) {
      usernameLabel.textContent = i18next.t('username');
    }

    const passwordLabel = document.querySelector('label[for="password"]');
    if (passwordLabel) {
      passwordLabel.textContent = i18next.t('password');
    }

    const loginBtn = document.querySelector('button.btn.btn-primary');
    if (loginBtn) {
      loginBtn.textContent = i18next.t('login');
    }

    // 登録促しのテキスト（HTML 内にリンクを含むため innerHTML を利用）
    const centeredText = document.querySelector('.centered-text');
    if (centeredText) {
      centeredText.innerHTML = i18next.t('registerPrompt');
    }

    // 言語変更時に再更新する場合（オプション）
    i18next.on('languageChanged', () => {
      if (loginTitle) loginTitle.textContent = i18next.t('login');
      if (usernameLabel) usernameLabel.textContent = i18next.t('username');
      if (passwordLabel) passwordLabel.textContent = i18next.t('password');
      if (loginBtn) loginBtn.textContent = i18next.t('login');
      if (centeredText) centeredText.innerHTML = i18next.t('registerPrompt');
    });
    // ----- ここまで、翻訳によるテキスト更新 -----

    // ----- 以下、既存のログイン処理コード -----
    const form = document.getElementById('login-form') as HTMLFormElement | null;
    const responseMessage = document.getElementById('response-message');

    if (!form) return;

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const formData = new FormData(form);

      const loginData = {
        username: formData.get('username'),
        password: formData.get('password'),
      };

      try {
        const response = await fetch(`${API_URL}/api/login/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(loginData),
        });

        if (response.ok) {
          const result = await response.json();
          localStorage.setItem('token', result.token);
          localStorage.setItem('username', result.username);
          // 翻訳されたメッセージを使用（登録済みのキーに合わせてください）
          responseMessage!.textContent = i18next.t('loginSuccess');
          responseMessage!.style.color = 'green';
          console.log(result);
          window.location.href = '/modes';
        } else {
          const error = await response.json();
          responseMessage!.textContent = i18next.t('errorMessage', {
            error: error.message || i18next.t('invalidCredentials'),
          });
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
  },
});

export default LoginPage;
