/**
 * useTranslation Hook
 * Provides access to i18n translations based on current language
 */
import { useLanguageStore } from '../store/languageStore';
import { translations } from './translations';

export const useTranslation = () => {
  const language = useLanguageStore((state) => state.language);
  
  const t = translations[language];
  
  return { t, language };
};
