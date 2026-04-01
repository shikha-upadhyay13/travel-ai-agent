// Simple OTP store — in production use Redis or SMS provider
const otpStore = new Map<string, { code: string; expires: number }>();

export function generateOTP(phone: string): string {
  // Dev mode: always "000000"
  if (process.env.NODE_ENV !== "production") {
    const code = "000000";
    otpStore.set(phone, { code, expires: Date.now() + 5 * 60 * 1000 });
    return code;
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(phone, { code, expires: Date.now() + 5 * 60 * 1000 });
  // TODO: Send SMS via Twilio/MSG91
  return code;
}

export function verifyOTP(phone: string, code: string): boolean {
  const stored = otpStore.get(phone);
  if (!stored) return false;
  if (Date.now() > stored.expires) {
    otpStore.delete(phone);
    return false;
  }
  if (stored.code !== code) return false;
  otpStore.delete(phone);
  return true;
}
