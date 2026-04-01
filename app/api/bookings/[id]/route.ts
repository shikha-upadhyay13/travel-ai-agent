import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { bookings } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// GET /api/bookings/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const booking = db
    .select()
    .from(bookings)
    .where(and(eq(bookings.id, id), eq(bookings.userId, session.userId)))
    .get();

  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ booking });
}

// PATCH /api/bookings/[id] — update status (confirm, cancel)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { status, providerPnr, selectedOption, totalPrice } = body;

  const existing = db
    .select()
    .from(bookings)
    .where(and(eq(bookings.id, id), eq(bookings.userId, session.userId)))
    .get();

  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (status) updates.status = status;
  if (providerPnr) updates.providerPnr = providerPnr;
  if (selectedOption) updates.selectedOption = JSON.stringify(selectedOption);
  if (totalPrice !== undefined) updates.totalPrice = totalPrice;

  db.update(bookings)
    .set(updates)
    .where(eq(bookings.id, id))
    .run();

  const updated = db.select().from(bookings).where(eq(bookings.id, id)).get();

  return NextResponse.json({ booking: updated });
}
