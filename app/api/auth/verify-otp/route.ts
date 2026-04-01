import { NextRequest, NextResponse } from "next/server";
import { verifyOTP } from "@/lib/auth/otp";
import { createSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { phone, otp, name } = await req.json();

  if (!phone || !otp) {
    return NextResponse.json({ error: "Phone and OTP required" }, { status: 400 });
  }

  const cleanPhone = phone.replace(/\s/g, "");

  if (!verifyOTP(cleanPhone, otp)) {
    return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 401 });
  }

  // Find or create user
  let user = db.select().from(users).where(eq(users.phone, cleanPhone)).get();

  if (!user) {
    const userId = `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    db.insert(users).values({
      id: userId,
      phone: cleanPhone,
      name: name || null,
      createdAt: new Date().toISOString(),
    }).run();
    user = db.select().from(users).where(eq(users.id, userId)).get();
  }

  if (!user) {
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }

  // Create session
  await createSession({
    userId: user.id,
    phone: user.phone,
    name: user.name || undefined,
  });

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      preferredLang: user.preferredLang,
      isNew: !user.name,
    },
  });
}
