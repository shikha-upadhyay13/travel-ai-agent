# app/api/bookings.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.config import get_logger
from app.db.database import get_user_bookings, get_booking, confirm_booking, cancel_booking

log = get_logger(__name__)
router = APIRouter(prefix="/bookings", tags=["bookings"])


class ConfirmRequest(BaseModel):
    booking_ref: str
    selected_index: int


class CancelRequest(BaseModel):
    booking_ref: str


@router.get("/{user_id}")
def list_bookings(user_id: str, limit: int = 10):
    """Get recent bookings for a user."""
    bookings = get_user_bookings(user_id, limit)
    return {
        "bookings": [
            {
                "booking_ref": b["booking_ref"],
                "mode": b["mode"],
                "source": b["source"],
                "destination": b["destination"],
                "travel_date": b["travel_date"],
                "status": b["status"],
                "total_price": b["total_price"],
                "created_at": b["created_at"],
            }
            for b in bookings
        ]
    }


@router.get("/detail/{booking_ref}")
def booking_detail(booking_ref: str):
    """Get full booking details."""
    booking = get_booking(booking_ref)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@router.post("/confirm")
def confirm(req: ConfirmRequest):
    """Confirm a booking by selecting one of the search results."""
    booking = get_booking(req.booking_ref)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking["status"] != "searched":
        raise HTTPException(status_code=400, detail=f"Booking is already {booking['status']}")

    results = booking["results"]
    if req.selected_index < 0 or req.selected_index >= len(results):
        raise HTTPException(status_code=400, detail="Invalid selection index")

    selected = results[req.selected_index]
    price = selected.get("price", 0)
    confirm_booking(req.booking_ref, selected, price)

    return {
        "message": "Booking confirmed",
        "booking_ref": req.booking_ref,
        "selected": selected,
        "total_price": price,
    }


@router.post("/cancel")
def cancel(req: CancelRequest):
    """Cancel a booking."""
    booking = get_booking(req.booking_ref)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking["status"] == "cancelled":
        raise HTTPException(status_code=400, detail="Booking is already cancelled")

    cancel_booking(req.booking_ref)
    return {"message": "Booking cancelled", "booking_ref": req.booking_ref}
