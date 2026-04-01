import Link from "next/link";

const QUICK_ACTIONS = [
  { icon: "\u{1F686}", label: "Book Train", desc: "Search & book train tickets", href: "/chat?intent=train" },
  { icon: "\u{1F68C}", label: "Book Bus", desc: "Interstate & city buses", href: "/chat?intent=bus" },
  { icon: "\u2708\uFE0F", label: "Book Flight", desc: "Domestic & international", href: "/chat?intent=flight" },
  { icon: "\u{1F3E8}", label: "Find Stay", desc: "Hotels, dharamshalas & more", href: "/chat?intent=stay" },
];

const MOCK_TRIPS = [
  {
    id: "1",
    icon: "\u{1F686}",
    route: "Hyderabad → New Delhi",
    details: "Telangana Exp · Apr 6 · Sleeper · Lower Berth",
    pnr: "4521678901",
    price: "\u20B9580",
    status: "Confirmed",
    statusColor: "bg-success-light text-success",
  },
  {
    id: "2",
    icon: "\u{1F68C}",
    route: "Tirupati → Chennai",
    details: "APSRTC Garuda · Apr 8",
    pnr: "BUS-892341",
    price: "\u20B9450",
    status: "Booked",
    statusColor: "bg-blue-light text-blue",
  },
];

export default function HomePage() {
  return (
    <div className="px-6 py-8 lg:px-10">
      {/* Greeting */}
      <div className="mb-8">
        <h2 className="font-[family-name:var(--font-instrument-serif)] text-3xl lg:text-4xl">
          Namaste! <span className="opacity-80">{"\u{1F64F}"}</span>
        </h2>
        <p className="mt-2 text-base text-muted">
          Where do you want to go today? Start a conversation or pick a quick action below.
        </p>
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

      {/* Two column: Trips + Start chat */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upcoming Trips */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
              Upcoming Trips
            </h3>
            <Link href="/bookings" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {MOCK_TRIPS.map((trip) => (
              <div
                key={trip.id}
                className="flex items-center justify-between rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-input-bg text-xl">
                    {trip.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{trip.route}</p>
                    <p className="mt-0.5 text-xs text-muted">{trip.details}</p>
                    <p className="text-xs text-muted">PNR: {trip.pnr}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-[11px] font-semibold ${trip.statusColor}`}
                  >
                    {trip.status}
                  </span>
                  <p className="mt-1 text-sm font-bold">{trip.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Start Conversation */}
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">
            AI Assistant
          </h3>
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary to-primary text-lg font-bold text-white">
              Y
            </div>
            <h4 className="font-[family-name:var(--font-instrument-serif)] text-lg">
              Talk to YatraAI
            </h4>
            <p className="mt-1 mb-5 text-sm text-muted">
              Tell me where you want to go — I&apos;ll handle the booking, find stays, and plan your trip.
            </p>
            <Link
              href="/chat"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Start a Conversation
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
