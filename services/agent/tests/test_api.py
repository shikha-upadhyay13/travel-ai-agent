"""Tests for API endpoints that don't require Ollama."""
import os
os.environ["DB_PATH"] = ":memory:"

from fastapi.testclient import TestClient
from app.main import app
from app.db.database import init_db


# Initialize DB before running tests (TestClient doesn't always trigger lifespan)
init_db()

client = TestClient(app)


class TestHealthEndpoint:
    def test_health_returns_api_status(self):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["api"] == "running"
        assert "ollama" in data
        assert "rag" in data
        assert "model" in data

    def test_health_has_healthy_field(self):
        response = client.get("/health")
        data = response.json()
        assert "healthy" in data


class TestQuickActions:
    def test_returns_actions(self):
        response = client.get("/quick-actions")
        assert response.status_code == 200
        data = response.json()
        assert "actions" in data
        assert len(data["actions"]) > 0

    def test_action_structure(self):
        response = client.get("/quick-actions")
        data = response.json()
        for action in data["actions"]:
            assert "label" in action
            assert "message" in action
            assert "icon" in action


class TestBookingsEndpoint:
    def test_list_empty_bookings(self):
        response = client.get("/bookings/nonexistent_user")
        assert response.status_code == 200
        data = response.json()
        assert data["bookings"] == []

    def test_booking_detail_not_found(self):
        response = client.get("/bookings/detail/FAKE-REF-123")
        assert response.status_code == 404

    def test_confirm_nonexistent_booking(self):
        response = client.post("/bookings/confirm", json={
            "booking_ref": "FAKE-REF-123",
            "selected_index": 0
        })
        assert response.status_code == 404

    def test_cancel_nonexistent_booking(self):
        response = client.post("/bookings/cancel", json={
            "booking_ref": "FAKE-REF-123"
        })
        assert response.status_code == 404


class TestChatEndpoint:
    def test_empty_message_rejected(self):
        response = client.post("/chat", json={
            "user_id": "test_user",
            "message": ""
        })
        assert response.status_code == 422

    def test_empty_user_id_rejected(self):
        response = client.post("/chat", json={
            "user_id": "",
            "message": "hello"
        })
        assert response.status_code == 422

    def test_missing_message_rejected(self):
        response = client.post("/chat", json={
            "user_id": "test_user"
        })
        assert response.status_code == 422

    def test_reset_command(self):
        response = client.post("/chat", json={
            "user_id": "test_reset_user",
            "message": "reset"
        })
        assert response.status_code == 200
        data = response.json()
        assert "reply" in data


class TestFrontend:
    def test_serves_index_html(self):
        response = client.get("/")
        assert response.status_code == 200
        assert "TravelAI" in response.text

    def test_serves_css(self):
        response = client.get("/static/css/styles.css")
        assert response.status_code == 200

    def test_serves_js(self):
        response = client.get("/static/js/app.js")
        assert response.status_code == 200

    def test_serves_voice_js(self):
        response = client.get("/static/js/voice.js")
        assert response.status_code == 200
