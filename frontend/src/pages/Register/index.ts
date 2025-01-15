import { Page } from '@/core/Page';
import CommonLayout from '@/layouts/common/index';

const RegisterPage = new Page({
  name: 'Register',
  config: {
    layout: CommonLayout,
  },
  mounted: async () => {
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
        const response = await fetch('http://127.0.0.1:8000/api/users/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });

        if (response.ok) {
          const result = await response.json();
          responseMessage!.textContent = 'Registration successful!';
          responseMessage!.style.color = 'green';
          console.log(result);
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

    const togglePasswordConfirmBtn = document.getElementById('toggle-password-confirm');
    if (togglePasswordConfirmBtn) {
      togglePasswordConfirmBtn.addEventListener('click', () => {
        const passwordConfirmField = document.getElementById('password_confirm') as HTMLInputElement;
        if (!passwordConfirmField) return;

        if (passwordConfirmField.type === 'password') {
          passwordConfirmField.type = 'text';
          togglePasswordConfirmBtn.textContent = 'Hide';
        } else {
          passwordConfirmField.type = 'password';
          togglePasswordConfirmBtn.textContent = 'Show';
        }
      });
    }
  },
});

export default RegisterPage;
