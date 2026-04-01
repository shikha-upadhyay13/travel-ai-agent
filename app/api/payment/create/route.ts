import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

// POST /api/payment/create — create a mock payment order
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookingId, amount } = await req.json();

  if (!bookingId || !amount) {
    return NextResponse.json({ error: "Missing bookingId or amount" }, { status: 400 });
  }

  // Mock payment order — in production this would call Razorpay
  const orderId = `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  return NextResponse.json({
    orderId,
    amount,
    currency: "INR",
    bookingId,
    // In production: razorpay order_id, key_id, etc.
    mock: true,
  });
}
