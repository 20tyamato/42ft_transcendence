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
        const response = await fetch('http://127.0.0.1:8000/api/login/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(loginData),
        });

        if (response.ok) {
          const result = await response.json();
          responseMessage!.textContent = 'Login successful!';
          responseMessage!.style.color = 'green';
          console.log(result);
          window.location.href = '/sample';
        } else {
          const error = await response.json();
          responseMessage!.textContent = `Error: ${error.message || 'Invalid credentials'}`;
          responseMessage!.style.color = 'red';
        }
      } catch (error) {
        console.error(error);
        responseMessage!.textContent = 'An unexpected error occurred.';
        responseMessage!.style.color = 'red';
      }
    });

    const togglePasswordBtn = document.getElementById('toggle-password');
    if (togglePasswordBtn) {
      togglePasswordBtn.addEventListener('click', () => {
        const passwordField = document.getElementById('password') as HTMLInputElement;
        if (!passwordField) return;

        if (passwordField.type === 'password') {
          passwordField.type = 'text';
          togglePasswordBtn.textContent = 'Hide';
        } else {
          passwordField.type = 'password';
          togglePasswordBtn.textContent = 'Show';
        }
      });
    }
  },
});

export default LoginPage;
