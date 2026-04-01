"use client";

import { useState } from "react";
import Link from "next/link";

const TABS = ["Upcoming", "Past", "Cancelled"] as const;

const MOCK_BOOKINGS = [
  {
    id: "1", icon: "\u{1F686}", route: "Hyderabad \u2192 New Delhi",
    details: "AP Express \u00B7 7 Apr \u00B7 Sleeper \u00B7 Lower Berth",
    pnr: "4521678901", price: 620, status: "Confirmed" as const, tab: "Upcoming" as const,
    departure: "17:30", arrival: "10:15", passenger: "Lakshmi Devi",
  },
  {
    id: "2", icon: "\u{1F68C}", route: "Tirupati \u2192 Chennai",
    details: "APSRTC Garuda Plus \u00B7 8 Apr",
    pnr: "BUS-892341", price: 450, status: "Booked" as const, tab: "Upcoming" as const,
    departure: "22:00", arrival: "06:30", passenger: "Lakshmi Devi",
  },
  {
    id: "3", icon: "\u{1F686}", route: "New Delhi \u2192 Hyderabad",
    details: "Rajdhani Express \u00B7 20 Mar \u00B7 3AC",
    pnr: "3217654890", price: 2100, status: "Completed" as const, tab: "Past" as const,
    departure: "16:00", arrival: "08:15", passenger: "Lakshmi Devi",
  },
  {
    id: "4", icon: "\u2708\uFE0F", route: "Mumbai \u2192 Bangalore",
    details: "IndiGo 6E-2345 \u00B7 15 Mar",
    pnr: "IND-78654", price: 3450, status: "Cancelled" as const, tab: "Cancelled" as const,
    departure: "06:15", arrival: "08:30", passenger: "Ramesh Kumar",
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const filtered = MOCK_BOOKINGS.filter((b) => b.tab === activeTab);

  const handleCancel = (id: string) => {
    setCancellingId(id);
    setTimeout(() => setCancellingId(null), 2000);
  };

  return (
    <div className="px-6 py-8 lg:px-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-[family-name:var(--font-instrument-serif)] text-2xl">Your Trips</h2>
        <Link href="/chat" className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:opacity-90 transition-opacity">
          + New Booking
        </Link>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        {TABS.map((tab) => {
          const count = MOCK_BOOKINGS.filter((b) => b.tab === tab).length;
          return (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setExpandedId(null); }}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors ${
                activeTab === tab
                  ? "bg-primary text-white"
                  : "border border-border bg-card text-muted hover:text-foreground"
              }`}
            >
              {tab} ({count})
            </button>
          );
        })}
      </div>

      {/* Bookings */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <p className="text-3xl mb-3">{activeTab === "Cancelled" ? "\u274C" : "\u{1F3AB}"}</p>
          <p className="text-muted mb-4">No {activeTab.toLowerCase()} trips</p>
          <Link href="/chat" className="text-sm font-medium text-primary hover:underline">Book a new trip</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((booking) => (
            <div
              key={booking.id}
              className="rounded-2xl border border-border bg-card overflow-hidden transition-all hover:shadow-sm"
            >
              {/* Main row */}
              <button
                onClick={() => setExpandedId(expandedId === booking.id ? null : booking.id)}
                className="flex w-full items-center justify-between p-5 text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-input-bg text-xl">{booking.icon}</div>
                  <div>
                    <p className="text-sm font-semibold">{booking.route}</p>
                    <p className="mt-0.5 text-xs text-muted">{booking.details}</p>
                    <p className="text-xs text-muted">PNR: {booking.pnr}</p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-4">
                  <div>
                    <span className={`inline-block rounded-full px-3 py-1 text-[11px] font-semibold ${STATUS_STYLES[booking.status]}`}>
                      {booking.status}
                    </span>
                    <p className="mt-1 text-base font-bold">\u20B9{booking.price}</p>
                  </div>
                  <svg
                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    className={`text-muted transition-transform ${expandedId === booking.id ? "rotate-180" : ""}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </button>

              {/* Expanded details */}
              {expandedId === booking.id && (
                <div className="border-t border-border px-5 py-4 bg-input-bg/30 animate-fade-in-up">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm mb-4">
                    <div>
                      <p className="text-[10px] uppercase text-muted font-semibold">Departure</p>
                      <p className="font-medium">{booking.departure}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-muted font-semibold">Arrival</p>
                      <p className="font-medium">{booking.arrival}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-muted font-semibold">Passenger</p>
                      <p className="font-medium">{booking.passenger}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-muted font-semibold">PNR Status</p>
                      <p className="font-medium text-success">{booking.status}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => alert(`E-ticket for PNR ${booking.pnr} would download here`)}
                      className="rounded-xl bg-blue-light px-4 py-2 text-xs font-semibold text-blue hover:bg-blue hover:text-white transition-colors"
                    >
                      {"\u{1F4CB}"} View E-Ticket
                    </button>
                    <button
                      onClick={() => navigator.share?.({ title: "My Trip", text: `${booking.route} - PNR: ${booking.pnr}` }).catch(() => alert(`Share: ${booking.route} - PNR: ${booking.pnr}`))}
                      className="rounded-xl bg-input-bg px-4 py-2 text-xs font-semibold text-muted hover:text-foreground transition-colors"
                    >
                      {"\u{1F4E4}"} Share
                    </button>
                    {booking.tab === "Upcoming" && (
                      <button
                        onClick={() => handleCancel(booking.id)}
                        disabled={cancellingId === booking.id}
                        className="rounded-xl bg-error-light px-4 py-2 text-xs font-semibold text-error hover:bg-error hover:text-white transition-colors disabled:opacity-50"
                      >
                        {cancellingId === booking.id ? "Cancelling..." : "\u274C"} {cancellingId !== booking.id && "Cancel"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
