export interface BookingStatus {
  status: "confirmed" | "pending" | "cancelled";
  pnr: string;
  trainName: string;
  trainNumber: string;
  date: string;
  departure: string;
  arrival: string;
  class: string;
  passenger: string;
  berth: string;
  price: number;
}

interface BookingStatusCardProps {
  booking: BookingStatus;
}

export function BookingStatusCard({ booking }: BookingStatusCardProps) {
  const isConfirmed = booking.status === "confirmed";

  return (
    <div
      className={`overflow-hidden rounded-2xl border-2 ${
        isConfirmed ? "border-success/30 bg-success-light/30" : "border-border bg-card"
      }`}
    >
      {/* Header */}
      <div
        className={`flex items-center gap-2 px-4 py-3 ${
          isConfirmed ? "bg-success-light" : "bg-input-bg"
        }`}
      >
        <span className="text-base">
          {isConfirmed ? "\u2705" : "\u23F3"}
        </span>
        <span
          className={`text-sm font-bold ${
            isConfirmed ? "text-success" : "text-muted"
          }`}
        >
          Booking {isConfirmed ? "Confirmed!" : "Pending"}
        </span>
      </div>

      {/* Details */}
      <div className="px-4 py-3 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">PNR</span>
          <span className="font-bold tracking-wide">{booking.pnr}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Train</span>
          <span className="font-medium">
            {"\u{1F686}"} {booking.trainName} ({booking.trainNumber})
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Date</span>
          <span className="font-medium">{booking.date}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Time</span>
          <span className="font-medium">
            {booking.departure} {"\u2192"} {booking.arrival}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Class</span>
          <span className="font-medium">{booking.class}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Passenger</span>
          <span className="font-medium">{booking.passenger}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Berth</span>
          <span className="font-medium text-success">
            {booking.berth} {"\u2705"}
          </span>
        </div>
        <div className="flex justify-between border-t border-border pt-2 mt-2">
          <span className="font-semibold">Total</span>
          <span className="text-base font-bold">
            {"\u20B9"}{booking.price.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 border-t border-border px-4 py-3">
        <button className="flex-1 rounded-xl bg-blue-light py-2 text-xs font-semibold text-blue transition-colors hover:bg-blue hover:text-white">
          View Ticket
        </button>
        <button className="flex-1 rounded-xl bg-input-bg py-2 text-xs font-semibold text-muted transition-colors hover:text-foreground">
          Share
        </button>
      </div>
    </div>
  );
}
