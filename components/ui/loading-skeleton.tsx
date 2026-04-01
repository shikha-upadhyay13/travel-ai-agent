export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-5 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-input-bg" />
            <div className="flex-1">
              <div className="h-4 w-48 rounded bg-input-bg mb-2" />
              <div className="h-3 w-32 rounded bg-input-bg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <div className="flex gap-3">
        <div className="h-9 w-9 rounded-xl bg-input-bg animate-pulse" />
        <div className="h-16 w-64 rounded-2xl bg-input-bg animate-pulse" />
      </div>
      <div className="flex justify-end">
        <div className="h-10 w-48 rounded-2xl bg-input-bg animate-pulse" />
      </div>
      <div className="flex gap-3">
        <div className="h-9 w-9 rounded-xl bg-input-bg animate-pulse" />
        <div className="h-32 w-80 rounded-2xl bg-input-bg animate-pulse" />
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="px-6 py-8 lg:px-10 animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-input-bg mb-6" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-input-bg" />
        ))}
      </div>
      <div className="h-4 w-32 rounded bg-input-bg mb-4" />
      <CardSkeleton count={2} />
    </div>
  );
}
