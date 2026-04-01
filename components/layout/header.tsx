"use client";

import { useState } from "react";
import { useTheme } from "@/components/providers/theme-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { LANG_LABELS, type Lang } from "@/lib/i18n/translations";

interface HeaderProps {
  title?: string;
}

const LANGS: Lang[] = ["en", "hi", "te"];

export function Header({ title = "YatraAI" }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card px-6 py-3">
      {/* Mobile logo */}
      <div className="flex items-center gap-2.5 md:hidden">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-secondary to-primary text-xs font-bold text-white">
          Y
        </div>
        <h1 className="font-[family-name:var(--font-instrument-serif)] text-lg">{title}</h1>
      </div>
      <div className="hidden md:block">
        <h1 className="text-sm font-semibold text-foreground">{title}</h1>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1.5">
        {/* Language switcher */}
        <div className="relative">
          <button
            onClick={() => setLangOpen(!langOpen)}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-input-bg hover:text-foreground transition-colors"
          >
            {LANG_LABELS[lang]}
          </button>
          {langOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setLangOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-40 w-36 rounded-xl border border-border bg-card p-1 shadow-lg">
                {LANGS.map((l) => (
                  <button
                    key={l}
                    onClick={() => { setLang(l); setLangOpen(false); }}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                      lang === l ? "bg-primary-light text-primary font-medium" : "text-foreground hover:bg-input-bg"
                    }`}
                  >
                    {LANG_LABELS[l]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-input-bg hover:text-foreground transition-colors">
          <MicIcon />
        </button>
        <button
          onClick={toggleTheme}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-input-bg hover:text-foreground transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "light" ? <MoonIcon /> : <SunIcon />}
        </button>
      </div>
    </header>
  );
}

function MicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}
