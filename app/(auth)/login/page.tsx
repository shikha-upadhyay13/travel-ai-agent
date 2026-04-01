"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Step = "phone" | "otp" | "name";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState("");

  const sendOtp = async () => {
    if (phone.length < 10) { setError("Enter a valid 10-digit phone number"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.startsWith("+") ? phone : `+91${phone}` }),
      });
      const data = await res.json();
      if (data.success) {
        setStep("otp");
        if (data.hint) setHint(data.hint);
      } else {
        setError(data.error || "Failed to send OTP");
      }
    } catch { setError("Network error"); }
    setLoading(false);
  };

  const verifyOtp = async () => {
    if (otp.length < 6) { setError("Enter the 6-digit OTP"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.startsWith("+") ? phone : `+91${phone}`,
          otp,
          name: name || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.user.isNew) {
          setStep("name");
        } else {
          router.push("/");
        }
      } else {
        setError(data.error || "Invalid OTP");
      }
    } catch { setError("Network error"); }
    setLoading(false);
  };

  const saveName = async () => {
    if (!name.trim()) { setError("Please enter your name"); return; }
    setLoading(true);
    // Re-verify with name to update
    try {
      // Generate new OTP for the update
      await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.startsWith("+") ? phone : `+91${phone}` }),
      });
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.startsWith("+") ? phone : `+91${phone}`,
          otp: "000000",
          name,
        }),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/");
      }
    } catch { router.push("/"); }
    setLoading(false);
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary to-primary text-2xl font-bold text-white">
            Y
          </div>
          <h1 className="font-[family-name:var(--font-instrument-serif)] text-3xl">YatraAI</h1>
          <p className="mt-1 text-sm text-muted">Book travel through conversation</p>
        </div>

        {/* Phone step */}
        {step === "phone" && (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Phone Number</label>
              <div className="flex gap-2">
                <span className="flex items-center rounded-xl border border-border bg-input-bg px-3 text-sm text-muted">+91</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="9876543210"
                  className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
                  autoFocus
                />
              </div>
            </div>
            {error && <p className="text-xs text-error">{error}</p>}
            <button
              onClick={sendOtp}
              disabled={loading || phone.length < 10}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
            <p className="text-center text-xs text-muted">
              We&apos;ll send a verification code to your phone
            </p>
          </div>
        )}

        {/* OTP step */}
        {step === "otp" && (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Enter OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-center text-lg tracking-[0.5em] outline-none focus:border-primary transition-colors"
                autoFocus
                maxLength={6}
              />
              <p className="mt-1.5 text-xs text-muted">Sent to +91 {phone}</p>
              {hint && (
                <p className="mt-1 rounded-lg bg-blue-light px-3 py-1.5 text-xs text-blue">{hint}</p>
              )}
            </div>
            {error && <p className="text-xs text-error">{error}</p>}
            <button
              onClick={verifyOtp}
              disabled={loading || otp.length < 6}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify & Login"}
            </button>
            <button onClick={() => { setStep("phone"); setError(""); }} className="w-full text-sm text-muted hover:text-foreground">
              Change phone number
            </button>
          </div>
        )}

        {/* Name step (new users) */}
        {step === "name" && (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">What should we call you?</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
                autoFocus
              />
            </div>
            {error && <p className="text-xs text-error">{error}</p>}
            <button
              onClick={saveName}
              disabled={loading || !name.trim()}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Setting up..." : "Get Started"}
            </button>
            <button onClick={() => router.push("/")} className="w-full text-sm text-muted hover:text-foreground">
              Skip for now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
