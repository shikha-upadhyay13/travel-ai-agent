"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { type Lang, t as translate } from "@/lib/i18n/translations";

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
});

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = localStorage.getItem("yatraai_lang") as Lang | null;
    if (stored && ["en", "hi", "te"].includes(stored)) {
      setLangState(stored);
    }
  }, []);

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem("yatraai_lang", newLang);
  }, []);

  const t = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (key: string) => translate(key as any, lang),
    [lang],
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
