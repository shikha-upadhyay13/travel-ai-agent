"use client";

interface PaymentSheetProps {
  amount: number;
  description: string;
  open: boolean;
  onClose: () => void;
  onPay: (method: string) => void;
}

const PAYMENT_METHODS = [
  { id: "gpay", label: "GPay", icon: "\u{1F4F1}" },
  { id: "phonepe", label: "PhonePe", icon: "\u{1F4F1}" },
  { id: "upi", label: "Other UPI", icon: "\u{1F4B3}" },
];

export function PaymentSheet({
  amount,
  description,
  open,
  onClose,
  onPay,
}: PaymentSheetProps) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up md:left-[240px]">
        <div className="mx-auto max-w-lg rounded-t-3xl bg-card shadow-lg border-t border-border">
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="h-1 w-10 rounded-full bg-border" />
          </div>

          <div className="px-6 pb-8">
            {/* Amount */}
            <div className="mb-1 text-center">
              <p className="text-2xl font-bold">
                {"\u20B9"}{amount.toLocaleString()}
              </p>
              <p className="text-xs text-muted">{description}</p>
            </div>

            {/* Payment methods */}
            <div className="mt-5 flex gap-3">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  onClick={() => onPay(method.id)}
                  className="flex flex-1 flex-col items-center gap-1.5 rounded-xl border border-border bg-card py-3 text-xs font-medium transition-all hover:border-success hover:bg-success-light first:border-success first:bg-success-light first:text-success"
                >
                  <span className="text-lg">{method.icon}</span>
                  {method.label}
                </button>
              ))}
            </div>

            {/* Pay button */}
            <button
              onClick={() => onPay("gpay")}
              className="mt-5 w-full rounded-xl bg-primary py-4 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              Pay {"\u20B9"}{amount.toLocaleString()} with GPay {"\u2192"}
            </button>

            <p className="mt-3 text-center text-[10px] text-muted">
              {"\u{1F512}"} Secured by Razorpay · Your data is encrypted
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
