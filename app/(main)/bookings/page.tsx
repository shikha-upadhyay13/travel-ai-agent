"use client";

import { useState } from "react";

const TABS = ["Upcoming", "Past", "Cancelled"] as const;

const MOCK_BOOKINGS = [
  {
    id: "1",
    icon: "\u{1F686}",
    route: "Hyderabad → New Delhi",
    details: "Telangana Express · 6 Apr · Sleeper · Lower Berth",
    pnr: "4521678901",
    price: 580,
    status: "Confirmed" as const,
    tab: "Upcoming" as const,
  },
  {
    id: "2",
    icon: "\u{1F68C}",
    route: "Tirupati → Chennai",
    details: "APSRTC Garuda Plus · 8 Apr",
    pnr: "BUS-892341",
    price: 450,
    status: "Booked" as const,
    tab: "Upcoming" as const,
  },
  {
    id: "3",
    icon: "\u{1F686}",
    route: "New Delhi → Hyderabad",
    details: "Rajdhani Express · 20 Mar · 3AC",
    pnr: "3217654890",
    price: 2100,
    status: "Completed" as const,
    tab: "Past" as const,
  },
];

const STATUS_STYLES = {
  Confirmed: "bg-success-light text-success",
  Booked: "bg-blue-light text-blue",
  Completed: "bg-input-bg text-muted",
  Cancelled: "bg-error-light text-error",
};

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Upcoming");

  const filtered = MOCK_BOOKINGS.filter((b) => b.tab === activeTab);

  return (
    <div className="px-6 py-8 lg:px-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-[family-name:var(--font-instrument-serif)] text-2xl">
          Your Trips
        </h2>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === tab
                ? "bg-primary text-white"
                : "border border-border bg-card text-muted hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Bookings grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <p className="text-muted">No {activeTab.toLowerCase()} trips</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((booking) => (
            <div
              key={booking.id}
              className="rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-input-bg text-lg">
                  {booking.icon}
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                    STATUS_STYLES[booking.status]
                  }`}
                >
                  {booking.status}
                </span>
              </div>
              <h3 className="text-sm font-semibold">{booking.route}</h3>
              <p className="mt-1 text-xs text-muted">{booking.details}</p>
              <p className="text-xs text-muted">PNR: {booking.pnr}</p>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <span className="text-base font-bold">{"\u20B9"}{booking.price}</span>
                <div className="flex gap-2">
                  <button className="rounded-lg bg-blue-light px-3 py-1.5 text-xs font-semibold text-blue transition-colors hover:bg-blue hover:text-white">
                    View Ticket
                  </button>
                  {booking.tab === "Upcoming" && (
                    <button className="rounded-lg bg-error-light px-3 py-1.5 text-xs font-semibold text-error transition-colors hover:bg-error hover:text-white">
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
