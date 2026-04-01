"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useUser } from "@/lib/hooks/use-user";

const AGENT_API = process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:8000";

const QUICK_ACTIONS = [
  { icon: "\u{1F686}", label: "Book Train", desc: "Search & book train tickets", href: "/chat?q=Book+a+train" },
  { icon: "\u{1F68C}", label: "Book Bus", desc: "Interstate & city buses", href: "/chat?q=Find+a+bus" },
  { icon: "\u2708\uFE0F", label: "Book Flight", desc: "Domestic & international", href: "/chat?q=Search+flights" },
  { icon: "\u{1F3E8}", label: "Find Stay", desc: "Hotels, dharamshalas & more", href: "/chat?q=Need+a+hotel" },
];

const MOCK_TRIPS = [
  {
    id: "1", icon: "\u{1F686}", route: "Hyderabad \u2192 New Delhi",
    details: "Telangana Exp \u00B7 Apr 6 \u00B7 Sleeper \u00B7 Lower Berth",
    pnr: "4521678901", price: "\u20B9580", status: "Confirmed",
    statusColor: "bg-success-light text-success",
  },
  {
    id: "2", icon: "\u{1F68C}", route: "Tirupati \u2192 Chennai",
    details: "APSRTC Garuda \u00B7 Apr 8",
    pnr: "BUS-892341", price: "\u20B9450", status: "Booked",
    statusColor: "bg-blue-light text-blue",
  },
];

const FEATURES = [
  { icon: "\u{1F30F}", title: "10+ Languages", desc: "Hindi, Telugu, Tamil, Marathi & more" },
  { icon: "\u{1F399}\uFE0F", title: "Voice Booking", desc: "Book tickets by just talking" },
  { icon: "\u{1F4B3}", title: "UPI Payment", desc: "Pay with GPay, PhonePe, or any UPI" },
  { icon: "\u{1F64F}", title: "Dharamshala Finder", desc: "Budget stays near pilgrimage sites" },
];

export default function HomePage() {
  const { user } = useUser();
  const [agentStatus, setAgentStatus] = useState<"checking" | "online" | "offline">("checking");

  useEffect(() => {
    fetch(`${AGENT_API}/health`, { signal: AbortSignal.timeout(3000) })
      .then((r) => setAgentStatus(r.ok ? "online" : "offline"))
      .catch(() => setAgentStatus("offline"));
  }, []);

  return (
    <div className="px-6 py-8 lg:px-10">
      {/* Hero */}
      <div className="mb-8">
        <h2 className="font-[family-name:var(--font-instrument-serif)] text-3xl lg:text-4xl">
          Namaste{user?.name ? `, ${user.name}` : ""}! <span className="opacity-80">{"\u{1F64F}"}</span>
        </h2>
        <p className="mt-2 text-base text-muted">
          Book trains, buses & flights through conversation. No forms, no confusion \u2014 just tell me where you want to go.
        </p>

        {/* Agent status */}
        <div className="mt-3 flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${agentStatus === "online" ? "bg-success" : agentStatus === "offline" ? "bg-warning" : "bg-muted"}`} />
          <span className="text-xs text-muted">
            {agentStatus === "online" ? "AI Agent connected" : agentStatus === "offline" ? "Demo mode (agent offline)" : "Checking agent..."}
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {QUICK_ACTIONS.map(({ icon, label, desc, href }) => (
          <Link
            key={label}
            href={href}
            className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary hover:shadow-md active:scale-[0.98]"
          >
            <span className="text-3xl">{icon}</span>
            <div>
              <span className="text-sm font-semibold group-hover:text-primary transition-colors">{label}</span>
              <p className="mt-0.5 text-xs text-muted">{desc}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upcoming Trips */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">Upcoming Trips</h3>
            <Link href="/bookings" className="text-xs font-medium text-primary hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {MOCK_TRIPS.map((trip) => (
              <div key={trip.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-input-bg text-xl">{trip.icon}</div>
                  <div>
                    <p className="text-sm font-semibold">{trip.route}</p>
                    <p className="mt-0.5 text-xs text-muted">{trip.details}</p>
                    <p className="text-xs text-muted">PNR: {trip.pnr}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-block rounded-full px-3 py-1 text-[11px] font-semibold ${trip.statusColor}`}>{trip.status}</span>
                  <p className="mt-1 text-sm font-bold">{trip.price}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Features */}
          <h3 className="mt-8 mb-4 text-sm font-semibold uppercase tracking-wider text-muted">Why YatraAI?</h3>
          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-card p-4">
                <span className="text-2xl">{f.icon}</span>
                <h4 className="mt-2 text-sm font-semibold">{f.title}</h4>
                <p className="mt-0.5 text-xs text-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Assistant card */}
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">AI Assistant</h3>
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary to-primary text-lg font-bold text-white">Y</div>
            <h4 className="font-[family-name:var(--font-instrument-serif)] text-lg">Talk to YatraAI</h4>
            <p className="mt-1 mb-5 text-sm text-muted">
              Tell me where you want to go \u2014 I'll handle the booking, find stays, and plan your trip. Just like talking to a friend.
            </p>
            <Link
              href="/chat"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Start a Conversation
            </Link>

            {/* Example prompts */}
            <div className="mt-4 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Try saying:</p>
              {[
                "Book train Delhi to Mumbai tomorrow",
                "\u0926\u093F\u0932\u094D\u0932\u0940 \u0938\u0947 \u092E\u0941\u0902\u092C\u0908 \u091F\u094D\u0930\u0947\u0928 \u092C\u0941\u0915 \u0915\u0930\u094B",
                "Find a bus to Tirupati this weekend",
              ].map((example) => (
                <Link
                  key={example}
                  href={`/chat?q=${encodeURIComponent(example)}`}
                  className="block rounded-xl bg-input-bg px-3 py-2 text-xs text-muted transition-colors hover:text-foreground hover:bg-border"
                >
                  &ldquo;{example}&rdquo;
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
