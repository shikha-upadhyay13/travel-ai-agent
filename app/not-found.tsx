import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center bg-background text-foreground">
      <div className="text-6xl mb-4">{"🗺️"}</div>
      <h1 className="font-[family-name:var(--font-instrument-serif)] text-3xl mb-2">
        Page Not Found
      </h1>
      <p className="text-muted mb-6 max-w-md">
        {"Looks like you've taken a wrong turn. Let me help you get back on track."}
      </p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          Go Home
        </Link>
        <Link
          href="/chat"
          className="rounded-xl border border-border px-6 py-2.5 text-sm font-semibold hover:bg-input-bg"
        >
          Start Chatting
        </Link>
      </div>
    </div>
  );
}
