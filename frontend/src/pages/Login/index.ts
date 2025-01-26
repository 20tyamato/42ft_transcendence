import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';

const LoginPage = new Page({
  name: 'Login',
  config: {
    layout: CommonLayout,
  },
  mounted: async () => {
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
        const response = await fetch('/api/login/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(loginData),
        });
        console.log('Response status:', response.status);
        console.log('Request URL:', response.url); // 実際のリクエストURLを確認
        console.log('Response headers:', response.headers);

        if (!response.ok) {
          const text = await response.text();
          console.log('Error response:', text);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (response.ok) {
          const result = await response.json();
          localStorage.setItem('token', result.token);
          localStorage.setItem('username', result.username);
          responseMessage!.textContent = 'Login successful!';
          responseMessage!.style.color = 'green';
          console.log(result);
          window.location.href = '/modes';
        } else {
          const error = await response.json();
          responseMessage!.textContent = `Error: ${error.message || 'Invalid credentials'}`;
          responseMessage!.style.color = 'red';
        }
      } catch (error) {
        console.error('Error details:', error);
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
  },
});

export default LoginPage;
