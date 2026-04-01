import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { bookings } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

// GET /api/bookings — list user's bookings
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = db
    .select()
    .from(bookings)
    .where(eq(bookings.userId, session.userId))
    .orderBy(desc(bookings.createdAt))
    .all();

  return NextResponse.json({ bookings: rows });
}

// POST /api/bookings — create a booking
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { mode, source, destination, travelDate, selectedOption, totalPrice } = body;

  if (!mode || !source || !destination) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const id = `bk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const bookingRef = `BK-${mode.toUpperCase().slice(0, 2)}-${Date.now().toString(36).toUpperCase()}`;
  const now = new Date().toISOString();

  db.insert(bookings).values({
    id,
    userId: session.userId,
    bookingRef,
    mode,
    source,
    destination,
    travelDate: travelDate || null,
    status: "pending",
    selectedOption: selectedOption ? JSON.stringify(selectedOption) : null,
    totalPrice: totalPrice || null,
    createdAt: now,
    updatedAt: now,
  }).run();

  const booking = db.select().from(bookings).where(eq(bookings.id, id)).get();

  return NextResponse.json({ booking }, { status: 201 });
}
