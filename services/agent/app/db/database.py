# app/db/database.py

import sqlite3
import json
import os
import threading
from datetime import datetime
from app.config import DB_PATH, get_logger

log = get_logger(__name__)

_local = threading.local()

SCHEMA = """
CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    language TEXT DEFAULT 'en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    booking_ref TEXT UNIQUE NOT NULL,
    mode TEXT NOT NULL CHECK(mode IN ('flight', 'train', 'bus')),
    source TEXT NOT NULL,
    destination TEXT NOT NULL,
    travel_date TEXT NOT NULL,
    travel_time TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'searched' CHECK(status IN ('searched', 'confirmed', 'cancelled')),
    results TEXT DEFAULT '[]',
    selected_option TEXT DEFAULT '',
    total_price INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
    user_id TEXT PRIMARY KEY,
    state TEXT DEFAULT '{}',
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_ref ON bookings(booking_ref);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(last_active);
"""


_initialized_paths = set()


def _get_connection() -> sqlite3.Connection:
    """Get a thread-local database connection, auto-initializing tables if needed."""
    if not hasattr(_local, "connection") or _local.connection is None:
        _local.connection = sqlite3.connect(DB_PATH)
        _local.connection.row_factory = sqlite3.Row
        if DB_PATH != ":memory:":
            _local.connection.execute("PRAGMA journal_mode=WAL")
        _local.connection.execute("PRAGMA foreign_keys=ON")
        # Auto-create tables on every new connection
        _local.connection.executescript(SCHEMA)
        _local.connection.commit()
    return _local.connection


def init_db():
    """Initialize the database schema (called at startup)."""
    conn = _get_connection()
    log.info("Database initialized at %s", DB_PATH)


def generate_booking_ref(mode: str) -> str:
    """Generate a unique booking reference like BK-FL-20260330-A1B2C3."""
    import uuid
    now = datetime.now()
    prefix = {"flight": "FL", "train": "TR", "bus": "BU"}.get(mode, "XX")
    date_part = now.strftime("%Y%m%d")
    unique = uuid.uuid4().hex[:6].upper()
    return f"BK-{prefix}-{date_part}-{unique}"


# ===== Conversation Operations =====

def save_message(user_id: str, role: str, content: str, language: str = "en"):
    """Save a chat message to the database."""
    conn = _get_connection()
    conn.execute(
        "INSERT INTO conversations (user_id, role, content, language) VALUES (?, ?, ?, ?)",
        (user_id, role, content, language)
    )
    conn.commit()


def get_conversation_history(user_id: str, limit: int = 20) -> list:
    """Get recent conversation history for a user."""
    conn = _get_connection()
    rows = conn.execute(
        "SELECT role, content, language, created_at FROM conversations "
        "WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
        (user_id, limit)
    ).fetchall()
    return [
        {"role": r["role"], "content": r["content"], "language": r["language"], "created_at": r["created_at"]}
        for r in reversed(rows)
    ]


def clear_conversation(user_id: str):
    """Clear all conversation history for a user."""
    conn = _get_connection()
    conn.execute("DELETE FROM conversations WHERE user_id = ?", (user_id,))
    conn.commit()


# ===== Session Operations =====

def save_session(user_id: str, state: dict):
    """Save or update session state."""
    conn = _get_connection()
    state_json = json.dumps(state)
    conn.execute(
        "INSERT INTO sessions (user_id, state, last_active) VALUES (?, ?, CURRENT_TIMESTAMP) "
        "ON CONFLICT(user_id) DO UPDATE SET state = ?, last_active = CURRENT_TIMESTAMP",
        (user_id, state_json, state_json)
    )
    conn.commit()


def get_session(user_id: str) -> dict:
    """Get session state for a user."""
    conn = _get_connection()
    row = conn.execute("SELECT state FROM sessions WHERE user_id = ?", (user_id,)).fetchone()
    if row:
        return json.loads(row["state"])
    return None


def clear_session(user_id: str):
    """Clear session state for a user."""
    conn = _get_connection()
    conn.execute("DELETE FROM sessions WHERE user_id = ?", (user_id,))
    conn.commit()


# ===== Booking Operations =====

def create_booking(user_id: str, mode: str, source: str, destination: str,
                   travel_date: str, results: list, travel_time: str = "") -> str:
    """Create a new booking record and return the booking reference."""
    booking_ref = generate_booking_ref(mode)
    conn = _get_connection()
    conn.execute(
        "INSERT INTO bookings (user_id, booking_ref, mode, source, destination, "
        "travel_date, travel_time, status, results) VALUES (?, ?, ?, ?, ?, ?, ?, 'searched', ?)",
        (user_id, booking_ref, mode, source, destination, travel_date, travel_time,
         json.dumps(results))
    )
    conn.commit()
    log.info("Booking created: %s for user %s", booking_ref, user_id)
    return booking_ref


def get_booking(booking_ref: str) -> dict:
    """Get a booking by reference."""
    conn = _get_connection()
    row = conn.execute("SELECT * FROM bookings WHERE booking_ref = ?", (booking_ref,)).fetchone()
    if row:
        booking = dict(row)
        booking["results"] = json.loads(booking["results"])
        return booking
    return None


def get_user_bookings(user_id: str, limit: int = 10) -> list:
    """Get recent bookings for a user."""
    conn = _get_connection()
    rows = conn.execute(
        "SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
        (user_id, limit)
    ).fetchall()
    bookings = []
    for row in rows:
        booking = dict(row)
        booking["results"] = json.loads(booking["results"])
        bookings.append(booking)
    return bookings


def confirm_booking(booking_ref: str, selected_option: dict, total_price: int):
    """Confirm a booking with a selected option."""
    conn = _get_connection()
    conn.execute(
        "UPDATE bookings SET status = 'confirmed', selected_option = ?, total_price = ?, "
        "updated_at = CURRENT_TIMESTAMP WHERE booking_ref = ?",
        (json.dumps(selected_option), total_price, booking_ref)
    )
    conn.commit()
    log.info("Booking confirmed: %s", booking_ref)


def cancel_booking(booking_ref: str):
    """Cancel a booking."""
    conn = _get_connection()
    conn.execute(
        "UPDATE bookings SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE booking_ref = ?",
        (booking_ref,)
    )
    conn.commit()
    log.info("Booking cancelled: %s", booking_ref)


def cleanup_old_sessions(days: int = 7):
    """Remove sessions inactive for more than N days."""
    conn = _get_connection()
    conn.execute(
        "DELETE FROM sessions WHERE last_active < datetime('now', ? || ' days')",
        (f"-{days}",)
    )
    conn.commit()
