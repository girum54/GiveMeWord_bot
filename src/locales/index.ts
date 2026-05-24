import i18next from "i18next";
import en from "./en.json";
import am from "./am.json";

export async function initI18n() {
  await i18next.init({
    lng: "en",
    fallbackLng: "en",
    resources: {
      en: { translation: en },
      am: { translation: am },
    },
    interpolation: {
      escapeValue: false,
    },
  });
}

/**
 * Get a translation for the given locale and key.
 */
export function t(locale: string, key: string, options?: Record<string, unknown>): string {
  return i18next.t(key, { lng: locale, ...options });
}

export default i18next;
