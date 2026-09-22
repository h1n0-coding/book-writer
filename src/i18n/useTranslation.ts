import { useLocaleStore } from "../stores/localeStore";
import { translations, type TranslationKey } from "./translations";

export function useTranslation() {
  const locale = useLocaleStore((s) => s.locale);

  function t(key: TranslationKey): string {
    return translations[locale][key];
  }

  return { t, locale };
}