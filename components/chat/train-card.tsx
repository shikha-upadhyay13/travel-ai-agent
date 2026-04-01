export interface TrainResult {
  name: string;
  number: string;
  departure: string;
  arrival: string;
  duration: string;
  price: number;
  class: string;
  seats: number;
  recommended?: boolean;
}

interface TrainCardProps {
  results: TrainResult[];
  onSelect?: (index: number) => void;
}

export function TrainCard({ results, onSelect }: TrainCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between bg-blue-light px-4 py-2.5">
        <span className="text-xs font-semibold text-blue">
          {"\u{1F686}"} {results.length} Trains Found
        </span>
      </div>

      {/* Results */}
      {results.map((train, i) => (
        <div
          key={train.number}
          className={`flex items-center justify-between border-t border-border px-4 py-3 transition-colors hover:bg-input-bg ${
            train.recommended ? "bg-success-light/30" : ""
          }`}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold truncate">
                {train.recommended && (
                  <span className="text-warning mr-1">{"\u2B50"}</span>
                )}
                {train.name}
              </span>
              <span className="text-[10px] text-muted">({train.number})</span>
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
              <span>{train.departure}</span>
              <span className="text-border">{"\u2192"}</span>
              <span>{train.arrival}</span>
              <span className="text-border">·</span>
              <span>{train.duration}</span>
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-xs">
              <span className="font-medium">{train.class}</span>
              <span className="text-border">·</span>
              <span className={`font-medium ${train.seats > 10 ? "text-success" : train.seats > 0 ? "text-warning" : "text-error"}`}>
                {train.seats > 0 ? `${train.seats} seats` : "Waitlisted"}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 ml-4">
            <span className="text-base font-bold text-success">
              {"\u20B9"}{train.price.toLocaleString()}
            </span>
            <button
              onClick={() => onSelect?.(i)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all active:scale-95 ${
                train.recommended
                  ? "bg-primary text-white hover:opacity-90"
                  : "border border-border text-foreground hover:border-primary hover:text-primary"
              }`}
            >
              Select
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
