export default function ProfilePage() {
  return (
    <div className="px-6 py-8 lg:px-10">
      <h2 className="mb-6 font-[family-name:var(--font-instrument-serif)] text-2xl">
        Profile
      </h2>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* User card */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary to-primary text-2xl font-bold text-white">
              L
            </div>
            <h3 className="text-base font-semibold">Lakshmi Devi</h3>
            <p className="text-sm text-muted">+91 98765 43210</p>
            <div className="mt-3 flex justify-center gap-4 text-xs text-muted">
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">12</p>
                <p>Trips</p>
              </div>
              <div className="h-10 w-px bg-border" />
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">2</p>
                <p>Travelers</p>
              </div>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="lg:col-span-2 space-y-2">
          {[
            { icon: "\u{1F310}", label: "Language", value: "English", desc: "Change your preferred language" },
            { icon: "\u{1F465}", label: "Saved Travelers", value: "2 travelers", desc: "Manage passenger details for quick booking" },
            { icon: "\u{1F4B3}", label: "Payment Methods", value: "UPI", desc: "Manage UPI IDs and saved cards" },
            { icon: "\u{1F514}", label: "Notifications", value: "On", desc: "PNR alerts, booking updates, offers" },
            { icon: "\u{2699}\uFE0F", label: "Accessibility", value: "", desc: "Font size, high contrast mode" },
            { icon: "\u2753", label: "Help & Support", value: "", desc: "Chat with us or call support" },
          ].map((item) => (
            <button
              key={item.label}
              className="flex w-full items-center justify-between rounded-2xl border border-border bg-card p-5 text-left transition-all hover:shadow-sm hover:border-primary/20"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-input-bg text-lg">
                  {item.icon}
                </div>
                <div>
                  <span className="text-sm font-medium">{item.label}</span>
                  <p className="text-xs text-muted">{item.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {item.value && (
                  <span className="text-xs font-medium text-muted">{item.value}</span>
                )}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
