import i18next from '@/config/i18n';

const updateActiveLanguageButton = () => {
  const selectedLang = i18next.language;
  const btnEn = document.getElementById('lang-en');
  const btnJa = document.getElementById('lang-ja');
  const btnFr = document.getElementById('lang-fr');

  if (btnEn) btnEn.classList.toggle('active', selectedLang === 'en');
  if (btnJa) btnJa.classList.toggle('active', selectedLang === 'ja');
  if (btnFr) btnFr.classList.toggle('active', selectedLang === 'fr');

  localStorage.setItem('language', selectedLang);
};

export { updateActiveLanguageButton };
