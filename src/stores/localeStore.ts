import { create } from "zustand";
import type { Locale } from "../i18n/translations";

const STORAGE_KEY = "book-writer-locale";

function loadInitialLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "ru" || stored === "en") return stored;
  } catch {
    // localStorage unavailable — fall back to default
  }
  return "ru";
}

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: loadInitialLocale(),
  setLocale: (locale) => {
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // ignore persistence errors
    }
    set({ locale });
  },
}));