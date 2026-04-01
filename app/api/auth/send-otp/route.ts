import { NextRequest, NextResponse } from "next/server";
import { generateOTP } from "@/lib/auth/otp";

export async function POST(req: NextRequest) {
  const { phone } = await req.json();

  if (!phone || !/^\+?[0-9]{10,13}$/.test(phone.replace(/\s/g, ""))) {
    return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
  }

  const cleanPhone = phone.replace(/\s/g, "");
  generateOTP(cleanPhone);

  return NextResponse.json({
    success: true,
    message: "OTP sent",
    // In dev mode, hint the OTP
    ...(process.env.NODE_ENV !== "production" && { hint: "Use 000000 in dev mode" }),
  });
}
