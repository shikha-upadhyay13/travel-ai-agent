interface TypingIndicatorProps {
  label?: string;
}

export function TypingIndicator({ label = "Thinking..." }: TypingIndicatorProps) {
  return (
    <div className="flex gap-3 animate-fade-in-up">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-secondary to-primary text-xs font-bold text-white">
        Y
      </div>
      <div className="flex items-center gap-2.5 rounded-2xl rounded-tl-sm bg-blue-light px-4 py-3">
        <div className="flex gap-1">
          <span
            className="h-2 w-2 rounded-full bg-blue"
            style={{ animation: "pulse-dot 1.2s ease-in-out infinite" }}
          />
          <span
            className="h-2 w-2 rounded-full bg-blue"
            style={{ animation: "pulse-dot 1.2s ease-in-out 0.15s infinite" }}
          />
          <span
            className="h-2 w-2 rounded-full bg-blue"
            style={{ animation: "pulse-dot 1.2s ease-in-out 0.3s infinite" }}
          />
        </div>
        <span className="text-xs text-muted">{label}</span>
      </div>
    </div>
  );
}
