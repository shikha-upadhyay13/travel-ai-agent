from app.services.flight_service import search_flights
from app.services.train_service import search_trains
from app.services.bus_service import search_buses


class TestFlightService:
    def test_returns_three_results(self):
        results = search_flights("Delhi", "Mumbai", "2026-03-30")
        assert len(results) == 3

    def test_result_structure(self):
        results = search_flights("Delhi", "Mumbai", "2026-03-30")
        for flight in results:
            assert "flight_id" in flight
            assert "airline" in flight
            assert "departure_time" in flight
            assert "arrival_time" in flight
            assert "price" in flight
            assert isinstance(flight["price"], int)

    def test_deterministic_results(self):
        r1 = search_flights("Delhi", "Mumbai", "2026-03-30")
        r2 = search_flights("Delhi", "Mumbai", "2026-03-30")
        assert r1 == r2

    def test_different_routes_differ(self):
        r1 = search_flights("Delhi", "Mumbai", "2026-03-30")
        r2 = search_flights("Bangalore", "Chennai", "2026-03-30")
        assert r1 != r2


class TestTrainService:
    def test_returns_three_results(self):
        results = search_trains("Delhi", "Mumbai", "2026-03-30")
        assert len(results) == 3

    def test_result_structure(self):
        results = search_trains("Delhi", "Mumbai", "2026-03-30")
        for train in results:
            assert "train_id" in train
            assert "train_name" in train
            assert "departure_time" in train
            assert "arrival_time" in train
            assert "class" in train
            assert "price" in train

    def test_deterministic(self):
        r1 = search_trains("Delhi", "Mumbai", "2026-03-30")
        r2 = search_trains("Delhi", "Mumbai", "2026-03-30")
        assert r1 == r2


class TestBusService:
    def test_returns_three_results(self):
        results = search_buses("Bangalore", "Chennai", "2026-03-30")
        assert len(results) == 3

    def test_result_structure(self):
        results = search_buses("Bangalore", "Chennai", "2026-03-30")
        for bus in results:
            assert "bus_id" in bus
            assert "operator" in bus
            assert "departure_time" in bus
            assert "arrival_time" in bus
            assert "bus_type" in bus
            assert "price" in bus

    def test_deterministic(self):
        r1 = search_buses("Bangalore", "Chennai", "2026-03-30")
        r2 = search_buses("Bangalore", "Chennai", "2026-03-30")
        assert r1 == r2
