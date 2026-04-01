export interface StayResult {
  name: string;
  type: string;
  price: string;
  distance: string;
  rating: number;
}

interface StayCardProps {
  stays: StayResult[];
}

export function StayCard({ stays }: StayCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between bg-secondary-light px-4 py-2.5">
        <span className="text-xs font-semibold text-secondary">
          {"\u{1F3E8}"} Stays Near Your Destination
        </span>
      </div>

      {/* Results */}
      {stays.map((stay) => (
        <div
          key={stay.name}
          className="flex items-center justify-between border-t border-border px-4 py-3 transition-colors hover:bg-input-bg"
        >
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold">{stay.name}</span>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
              <span>{stay.distance}</span>
              <span className="text-border">·</span>
              <span>{stay.type}</span>
            </div>
            <div className="mt-0.5 flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={`text-[10px] ${i < stay.rating ? "text-warning" : "text-border"}`}
                >
                  {"\u2605"}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 ml-4">
            <span className="text-sm font-bold text-success">{stay.price}</span>
            <button className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:border-primary hover:text-primary active:scale-95">
              Book
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
