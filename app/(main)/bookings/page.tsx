"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Booking {
  id: string;
  bookingRef: string;
  mode: string;
  source: string;
  destination: string;
  travelDate: string | null;
  status: string;
  selectedOption: string | null;
  totalPrice: number | null;
  providerPnr: string | null;
  createdAt: string;
}

const TABS = ["All", "Confirmed", "Pending", "Cancelled"] as const;

const MODE_ICONS: Record<string, string> = { train: "\u{1F686}", bus: "\u{1F68C}", flight: "\u2708\uFE0F" };

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-success-light text-success",
  pending: "bg-warning-light text-warning",
  cancelled: "bg-error-light text-error",
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch("/api/bookings");
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
      }
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleCancel = async (id: string) => {
    try {
      await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      fetchBookings();
    } catch (err) {
      console.error("Cancel failed:", err);
    }
  };

  const filtered = activeTab === "All"
    ? bookings
    : bookings.filter((b) => b.status.toLowerCase() === activeTab.toLowerCase());

  const parseOption = (opt: string | null) => {
    if (!opt) return null;
    try { return JSON.parse(opt); } catch { return null; }
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
          const count = tab === "All" ? bookings.length : bookings.filter((b) => b.status.toLowerCase() === tab.toLowerCase()).length;
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

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5 animate-pulse">
              <div className="h-4 w-48 rounded bg-input-bg mb-2" />
              <div className="h-3 w-32 rounded bg-input-bg" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <p className="text-3xl mb-3">{"\u{1F3AB}"}</p>
          <p className="text-muted mb-4">
            {bookings.length === 0 ? "No trips yet. Book your first trip!" : `No ${activeTab.toLowerCase()} bookings`}
          </p>
          <Link href="/chat" className="inline-block rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90">
            Book a Trip
          </Link>
        </div>
      )}

      {/* Bookings list */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map((booking) => {
            const option = parseOption(booking.selectedOption);
            return (
              <div key={booking.id} className="rounded-2xl border border-border bg-card overflow-hidden transition-all hover:shadow-sm">
                <button
                  onClick={() => setExpandedId(expandedId === booking.id ? null : booking.id)}
                  className="flex w-full items-center justify-between p-5 text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-input-bg text-xl">
                      {MODE_ICONS[booking.mode] || "\u{1F3AB}"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">
                        {booking.source} {"\u2192"} {booking.destination}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {option?.name || booking.mode} {booking.travelDate ? `\u00B7 ${booking.travelDate}` : ""}
                      </p>
                      {booking.providerPnr && (
                        <p className="text-xs text-muted">PNR: {booking.providerPnr}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div>
                      <span className={`inline-block rounded-full px-3 py-1 text-[11px] font-semibold capitalize ${STATUS_STYLES[booking.status] || "bg-input-bg text-muted"}`}>
                        {booking.status}
                      </span>
                      {booking.totalPrice && (
                        <p className="mt-1 text-base font-bold">{"\u20B9"}{booking.totalPrice}</p>
                      )}
                    </div>
                    <svg
                      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      className={`text-muted transition-transform ${expandedId === booking.id ? "rotate-180" : ""}`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </button>

                {expandedId === booking.id && (
                  <div className="border-t border-border px-5 py-4 bg-input-bg/30 animate-fade-in-up">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm mb-4">
                      <div>
                        <p className="text-[10px] uppercase text-muted font-semibold">Booking Ref</p>
                        <p className="font-medium text-xs">{booking.bookingRef}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-muted font-semibold">Mode</p>
                        <p className="font-medium capitalize">{booking.mode}</p>
                      </div>
                      {option?.departure && (
                        <div>
                          <p className="text-[10px] uppercase text-muted font-semibold">Departure</p>
                          <p className="font-medium">{option.departure}</p>
                        </div>
                      )}
                      {option?.arrival && (
                        <div>
                          <p className="text-[10px] uppercase text-muted font-semibold">Arrival</p>
                          <p className="font-medium">{option.arrival}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {booking.providerPnr && (
                        <button
                          onClick={() => alert(`E-Ticket\n\nPNR: ${booking.providerPnr}\n${booking.source} → ${booking.destination}\n${option?.name || booking.mode}\n₹${booking.totalPrice}`)}
                          className="rounded-xl bg-blue-light px-4 py-2 text-xs font-semibold text-blue hover:bg-blue hover:text-white transition-colors"
                        >
                          {"\u{1F4CB}"} View E-Ticket
                        </button>
                      )}
                      <button
                        onClick={() => {
                          const text = `My Trip: ${booking.source} → ${booking.destination}${booking.providerPnr ? ` | PNR: ${booking.providerPnr}` : ""} | ₹${booking.totalPrice}`;
                          navigator.share?.({ title: "My Trip", text }).catch(() => navigator.clipboard?.writeText(text).then(() => alert("Copied to clipboard!")));
                        }}
                        className="rounded-xl bg-input-bg px-4 py-2 text-xs font-semibold text-muted hover:text-foreground transition-colors"
                      >
                        {"\u{1F4E4}"} Share
                      </button>
                      {booking.status !== "cancelled" && (
                        <button
                          onClick={() => handleCancel(booking.id)}
                          className="rounded-xl bg-error-light px-4 py-2 text-xs font-semibold text-error hover:bg-error hover:text-white transition-colors"
                        >
                          {"\u274C"} Cancel
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
