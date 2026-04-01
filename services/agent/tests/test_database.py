import os
import sqlite3
import json
import threading

# Override DB_PATH before importing database module
os.environ["DB_PATH"] = ":memory:"

# We need to handle the thread-local connections for testing
from app.db import database as db


class TestDatabase:
    def setup_method(self):
        """Reset the database for each test."""
        # Force a new in-memory connection for the test thread
        db._local.connection = None
        db.DB_PATH = ":memory:"
        db.init_db()

    def test_init_creates_tables(self):
        conn = db._get_connection()
        tables = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table'"
        ).fetchall()
        table_names = [t["name"] for t in tables]
        assert "conversations" in table_names
        assert "bookings" in table_names
        assert "sessions" in table_names

    def test_save_and_get_messages(self):
        db.save_message("user1", "user", "Hello")
        db.save_message("user1", "assistant", "Hi there!")
        history = db.get_conversation_history("user1")
        assert len(history) == 2
        assert history[0]["role"] == "user"
        assert history[0]["content"] == "Hello"
        assert history[1]["role"] == "assistant"

    def test_conversation_limit(self):
        for i in range(30):
            db.save_message("user1", "user", f"msg {i}")
        history = db.get_conversation_history("user1", limit=10)
        assert len(history) == 10

    def test_clear_conversation(self):
        db.save_message("user1", "user", "Hello")
        db.clear_conversation("user1")
        history = db.get_conversation_history("user1")
        assert len(history) == 0

    def test_sessions(self):
        db.save_session("user1", {"intent": "booking", "slots": {"mode": "flight"}})
        state = db.get_session("user1")
        assert state is not None
        assert state["intent"] == "booking"
        assert state["slots"]["mode"] == "flight"

    def test_session_update(self):
        db.save_session("user1", {"intent": "booking"})
        db.save_session("user1", {"intent": "travel_query"})
        state = db.get_session("user1")
        assert state["intent"] == "travel_query"

    def test_clear_session(self):
        db.save_session("user1", {"intent": "booking"})
        db.clear_session("user1")
        state = db.get_session("user1")
        assert state is None

    def test_create_booking(self):
        ref = db.create_booking(
            "user1", "flight", "Delhi", "Mumbai",
            "2026-03-30", [{"airline": "IndiGo", "price": 5000}]
        )
        assert ref.startswith("BK-FL-")

    def test_get_booking(self):
        ref = db.create_booking(
            "user1", "train", "Chennai", "Bangalore",
            "2026-04-01", [{"train_name": "Shatabdi", "price": 1500}]
        )
        booking = db.get_booking(ref)
        assert booking is not None
        assert booking["mode"] == "train"
        assert booking["source"] == "Chennai"
        assert booking["status"] == "searched"
        assert len(booking["results"]) == 1

    def test_confirm_booking(self):
        ref = db.create_booking(
            "user1", "bus", "Hyderabad", "Bangalore",
            "2026-04-02", [{"operator": "VRL", "price": 800}]
        )
        db.confirm_booking(ref, {"operator": "VRL", "price": 800}, 800)
        booking = db.get_booking(ref)
        assert booking["status"] == "confirmed"
        assert booking["total_price"] == 800

    def test_cancel_booking(self):
        ref = db.create_booking(
            "user1", "flight", "Delhi", "Goa",
            "2026-05-01", [{"airline": "SpiceJet", "price": 4500}]
        )
        db.cancel_booking(ref)
        booking = db.get_booking(ref)
        assert booking["status"] == "cancelled"

    def test_get_user_bookings(self):
        db.create_booking("user1", "flight", "Delhi", "Mumbai", "2026-03-30", [])
        db.create_booking("user1", "train", "Chennai", "Bangalore", "2026-04-01", [])
        db.create_booking("user2", "bus", "Hyderabad", "Goa", "2026-04-02", [])

        user1_bookings = db.get_user_bookings("user1")
        assert len(user1_bookings) == 2

        user2_bookings = db.get_user_bookings("user2")
        assert len(user2_bookings) == 1

    def test_generate_booking_ref_uniqueness(self):
        refs = set()
        for _ in range(100):
            ref = db.generate_booking_ref("flight")
            refs.add(ref)
        assert len(refs) == 100  # All unique

    def test_message_language_tracking(self):
        db.save_message("user1", "user", "Hello", "en")
        db.save_message("user1", "user", "Namaste", "hi")
        history = db.get_conversation_history("user1")
        assert history[0]["language"] == "en"
        assert history[1]["language"] == "hi"
