document.getElementById('register-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
  
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
  
    const userData = {
      username: formData.get('username'),
      email: formData.get('email'),
      display_name: formData.get('display_name'),
      avatar: formData.get('avatar'),
      level: formData.get('level') ? Number(formData.get('level')) : 1,
    };
  
    try {
      const response = await fetch('https://127.0.0.1:8000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
  
      if (response.ok) {
        const result = await response.json();
        document.getElementById('response-message')!.innerText = 'Registration successful!';
      } else {
        const error = await response.json();
        document.getElementById('response-message')!.innerText = `Error: ${error.message}`;
      }
    } catch (error) {
      document.getElementById('response-message')!.innerText = 'An unexpected error occurred.';
    }
  });
