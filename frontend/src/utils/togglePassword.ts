export const registerTogglePassword = (toggleBtnId: string, fieldId: string, iconId: string): void => {
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
