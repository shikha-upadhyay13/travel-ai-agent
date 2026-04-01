import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { bookings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// POST /api/payment/verify — verify payment and confirm booking
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookingId, orderId } = await req.json();

  if (!bookingId || !orderId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Mock verification — always succeeds in dev
  // In production: verify Razorpay signature

  const pnr = Math.floor(1000000000 + Math.random() * 9000000000).toString();

  db.update(bookings)
    .set({
      status: "confirmed",
      providerPnr: pnr,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(bookings.id, bookingId))
    .run();

  const booking = db.select().from(bookings).where(eq(bookings.id, bookingId)).get();

  return NextResponse.json({
    success: true,
    pnr,
    booking,
  });
}
