"use client";

import { useState } from "react";
import { useTheme } from "@/components/providers/theme-provider";

const LANGUAGES = ["English", "Hindi", "Telugu", "Tamil", "Marathi", "Bengali", "Kannada"];

export default function ProfilePage() {
  const { theme, toggleTheme } = useTheme();
  const [selectedLang, setSelectedLang] = useState("English");
  const [fontSize, setFontSize] = useState<"normal" | "large" | "xlarge">("normal");
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="px-6 py-8 lg:px-10">
      <h2 className="mb-6 font-[family-name:var(--font-instrument-serif)] text-2xl">
        Profile & Settings
      </h2>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* User card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary to-primary text-xl font-bold text-white">
                L
              </div>
              <div>
                <h3 className="text-base font-semibold">Lakshmi Devi</h3>
                <p className="text-sm text-muted">+91 98765 43210</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-input-bg p-3 text-center">
                <p className="text-lg font-bold">12</p>
                <p className="text-[10px] text-muted">Total Trips</p>
              </div>
              <div className="rounded-xl bg-input-bg p-3 text-center">
                <p className="text-lg font-bold">2</p>
                <p className="text-[10px] text-muted">Saved Travelers</p>
              </div>
            </div>
          </div>

          {/* Saved travelers */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h4 className="text-sm font-semibold mb-3">Saved Travelers</h4>
            {[
              { name: "Lakshmi Devi", age: 65, gender: "F", berth: "Lower" },
              { name: "Ramesh Kumar", age: 28, gender: "M", berth: "Any" },
            ].map((t) => (
              <div key={t.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted">{t.age}y, {t.gender} \u00B7 Berth: {t.berth}</p>
                </div>
                <button className="text-xs text-primary font-medium">Edit</button>
              </div>
            ))}
            <button className="mt-3 w-full rounded-xl border border-dashed border-border py-2 text-xs font-medium text-muted hover:text-primary hover:border-primary transition-colors">
              + Add Traveler
            </button>
          </div>
        </div>

        {/* Settings */}
        <div className="lg:col-span-2 space-y-4">
          {/* Language */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h4 className="text-sm font-semibold mb-1">Language</h4>
            <p className="text-xs text-muted mb-3">YatraAI will respond in your preferred language</p>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLang(lang)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                    selectedLang === lang
                      ? "bg-primary text-white"
                      : "border border-border text-muted hover:text-foreground hover:border-foreground"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h4 className="text-sm font-semibold mb-1">Appearance</h4>
            <p className="text-xs text-muted mb-3">Choose your preferred theme</p>
            <div className="flex gap-3">
              <button
                onClick={() => theme === "dark" && toggleTheme()}
                className={`flex-1 rounded-xl border py-3 text-sm font-medium transition-all ${
                  theme === "light" ? "border-primary bg-primary-light text-primary" : "border-border text-muted"
                }`}
              >
                \u2600\uFE0F Light
              </button>
              <button
                onClick={() => theme === "light" && toggleTheme()}
                className={`flex-1 rounded-xl border py-3 text-sm font-medium transition-all ${
                  theme === "dark" ? "border-primary bg-primary-light text-primary" : "border-border text-muted"
                }`}
              >
                {"\u{1F319}"} Dark
              </button>
            </div>
          </div>

          {/* Font size */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h4 className="text-sm font-semibold mb-1">Text Size</h4>
            <p className="text-xs text-muted mb-3">Adjust for comfortable reading</p>
            <div className="flex gap-3">
              {([["normal", "Aa", "Default"], ["large", "Aa", "Large"], ["xlarge", "Aa", "Extra Large"]] as const).map(([size, preview, label]) => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={`flex-1 rounded-xl border py-3 text-center transition-all ${
                    fontSize === size ? "border-primary bg-primary-light text-primary" : "border-border text-muted"
                  }`}
                >
                  <span className={size === "normal" ? "text-sm" : size === "large" ? "text-base" : "text-lg"}>{preview}</span>
                  <p className="text-[10px] mt-0.5">{label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold">Notifications</h4>
                <p className="text-xs text-muted">PNR status, booking updates, travel alerts</p>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`relative h-7 w-12 rounded-full transition-colors ${notifications ? "bg-success" : "bg-border"}`}
              >
                <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${notifications ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </div>
          </div>

          {/* Payment */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h4 className="text-sm font-semibold mb-1">Payment Methods</h4>
            <p className="text-xs text-muted mb-3">Saved UPI IDs for quick payment</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-xl bg-input-bg p-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{"\u{1F4F1}"}</span>
                  <div>
                    <p className="text-sm font-medium">Google Pay</p>
                    <p className="text-xs text-muted">lakshmi@okaxis</p>
                  </div>
                </div>
                <span className="rounded-full bg-success-light px-2 py-0.5 text-[10px] font-semibold text-success">Default</span>
              </div>
            </div>
            <button className="mt-3 w-full rounded-xl border border-dashed border-border py-2 text-xs font-medium text-muted hover:text-primary hover:border-primary transition-colors">
              + Add Payment Method
            </button>
          </div>

          {/* Help */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h4 className="text-sm font-semibold mb-3">Help & Support</h4>
            <div className="grid grid-cols-2 gap-3">
              <a href="/chat" className="rounded-xl bg-input-bg p-3 text-center text-sm font-medium hover:bg-border transition-colors">
                {"\u{1F4AC}"} Chat with us
              </a>
              <a href="tel:+911234567890" className="rounded-xl bg-input-bg p-3 text-center text-sm font-medium hover:bg-border transition-colors">
                {"\u{1F4DE}"} Call support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
