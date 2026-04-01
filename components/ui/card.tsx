interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-[var(--radius-md)] border border-border bg-card p-4 ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = "",
}: CardProps) {
  return (
    <div
      className={`flex items-center gap-2 border-b border-border px-4 py-2.5 text-xs font-semibold ${className}`}
    >
      {children}
    </div>
  );
}

export function CardContent({
  children,
  className = "",
}: CardProps) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}
