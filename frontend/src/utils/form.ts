import i18next from '@/config/i18n';

export const validateRequiredFields = (fields: Record<string, string>): string | null => {
  for (const [, value] of Object.entries(fields)) {
    if (!value) {
      return i18next.t('allFieldsRequired');
    }
  }
  return null;
};

export const validateEmailFormat = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) ? null : i18next.t('validEmail');
};

export const validatePasswordMatch = (password: string, passwordConfirm: string): string | null => {
  return password === passwordConfirm ? null : i18next.t('passwordsDoNotMatch');
};

export const validateRegistrationForm = (formData: FormData): string | null => {
  const fields = {
    username: formData.get('username') as string,
    email: formData.get('email') as string,
    displayName: formData.get('displayName') as string,
    password: formData.get('password') as string,
    passwordConfirm: formData.get('password_confirm') as string,
  };

  // 必須項目のバリデーション
  const requiredError = validateRequiredFields(fields);
  if (requiredError) return requiredError;

  // メールアドレスの形式チェック
  const emailError = validateEmailFormat(fields.email);
  if (emailError) return emailError;

  // パスワード一致チェック
  const passwordError = validatePasswordMatch(fields.password, fields.passwordConfirm);
  if (passwordError) return passwordError;

  return null;
};
