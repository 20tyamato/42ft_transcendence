import { logger } from '@/core/Logger';
import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from '../locales/en.json';
import fr from '../locales/fr.json';
import ja from '../locales/ja.json';

i18next.use(LanguageDetector).init(
  {
    fallbackLng: 'en',
    debug: true,
    resources: {
      en: { translation: en },
      ja: { translation: ja },
      fr: { translation: fr },
    },
  },
  (err) => {
    if (err) logger.error(err);
  }
);

export default i18next;
