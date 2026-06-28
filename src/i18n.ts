import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import translationEN from "./locales/en/translation.json";
import translationAR from "./locales/ar/translation.json";

// Retrieve persisted language or fallback to 'ar'
const savedLanguage = localStorage.getItem("app_language") as "ar" | "en" | null;
const initialLanguage = savedLanguage || "ar";

// Update document properties for the initial language
if (typeof document !== "undefined") {
  document.dir = initialLanguage === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = initialLanguage;
}

const resources = {
  en: {
    translation: translationEN,
  },
  ar: {
    translation: translationAR,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLanguage,
    fallbackLng: "ar",
    interpolation: {
      escapeValue: false, // React already safe from XSS
    },
  });

export default i18n;
