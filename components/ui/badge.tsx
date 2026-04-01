interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "warning" | "error" | "blue" | "muted";
  className?: string;
}

const VARIANT_STYLES = {
  success: "bg-success-light text-success",
  warning: "bg-warning-light text-warning",
  error: "bg-error-light text-error",
  blue: "bg-blue-light text-blue",
  muted: "bg-input-bg text-muted",
};

export function Badge({
  children,
  variant = "muted",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${VARIANT_STYLES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
