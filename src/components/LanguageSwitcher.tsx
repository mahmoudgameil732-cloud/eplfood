import React from "react";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || "ar";

  const toggleLanguage = () => {
    const nextLang = currentLang === "ar" ? "en" : "ar";
    i18n.changeLanguage(nextLang);
    localStorage.setItem("app_language", nextLang);
    document.dir = nextLang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = nextLang;
    
    // Dispatch event to notify listeners of language change if needed
    window.dispatchEvent(new Event("languagechange"));
  };

  return (
    <button
      id="language-switcher-btn"
      type="button"
      onClick={toggleLanguage}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-250 bg-white/95 hover:bg-slate-50 text-slate-750 text-xxs sm:text-xs font-bold shadow-xxs transition-all cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700 select-none"
    >
      <Globe className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
      <span>{currentLang === "ar" ? "English" : "العربية"}</span>
    </button>
  );
}
