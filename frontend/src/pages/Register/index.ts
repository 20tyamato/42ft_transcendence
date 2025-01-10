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

      const userData = {
        username: formData.get('username'),
        email: formData.get('email'),
        display_name: formData.get('display_name'),
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
  },
});

export default RegisterPage;
