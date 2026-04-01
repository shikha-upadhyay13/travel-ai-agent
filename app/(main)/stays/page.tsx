const MOCK_STAYS = [
  {
    name: "Gurudwara Bangla Sahib",
    type: "Dharamshala",
    price: "Free",
    priceNote: "Langar included",
    distance: "2.1 km from New Delhi station",
    rating: 4,
    icon: "\u{1F64F}",
  },
  {
    name: "Railway Retiring Room",
    type: "Retiring Room",
    price: "\u20B9350/night",
    priceNote: "Platform access",
    distance: "Platform 1, New Delhi",
    rating: 3,
    icon: "\u{1F6CF}\uFE0F",
  },
  {
    name: "OYO Townhouse Connaught Place",
    type: "Hotel",
    price: "\u20B9899/night",
    priceNote: "AC, WiFi, Breakfast",
    distance: "3.5 km from station",
    rating: 4,
    icon: "\u{1F3E8}",
  },
  {
    name: "Zostel Delhi",
    type: "Hostel",
    price: "\u20B9499/night",
    priceNote: "Dorm bed, common area",
    distance: "4.2 km from station",
    rating: 4,
    icon: "\u{1F6CC}",
  },
  {
    name: "Dharamshala Ram Mandir",
    type: "Dharamshala",
    price: "\u20B9100/night",
    priceNote: "Basic rooms",
    distance: "1.8 km from station",
    rating: 3,
    icon: "\u{1F64F}",
  },
  {
    name: "Treebo Trend Paharganj",
    type: "Hotel",
    price: "\u20B91,200/night",
    priceNote: "AC, Restaurant",
    distance: "0.5 km from station",
    rating: 4,
    icon: "\u{1F3E8}",
  },
];

const FILTERS = ["All", "Hotels", "Dharamshala", "Hostel", "Retiring Room"];

export default function StaysPage() {
  return (
    <div className="px-6 py-8 lg:px-10">
      <div className="mb-6">
        <h2 className="font-[family-name:var(--font-instrument-serif)] text-2xl">
          Find a Stay
        </h2>
        <p className="mt-1 text-sm text-muted">
          Hotels, dharamshalas, homestays, and retiring rooms near your destination
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
              filter === "All"
                ? "border-primary bg-primary-light text-primary"
                : "border-border bg-card text-muted hover:text-foreground hover:border-foreground"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Stays grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MOCK_STAYS.map((stay) => (
          <div
            key={stay.name}
            className="rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-md"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-input-bg text-lg">
                {stay.icon}
              </div>
              <span className="rounded-full bg-input-bg px-2.5 py-0.5 text-[10px] font-semibold text-muted">
                {stay.type}
              </span>
            </div>
            <h3 className="text-sm font-semibold">{stay.name}</h3>
            <p className="mt-0.5 text-xs text-muted">{stay.distance}</p>
            <div className="mt-2 flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={`text-xs ${i < stay.rating ? "text-warning" : "text-border"}`}
                >
                  {"\u2605"}
                </span>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <div>
                <p className="text-base font-bold text-success">{stay.price}</p>
                <p className="text-[10px] text-muted">{stay.priceNote}</p>
              </div>
              <button className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90">
                Book
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
