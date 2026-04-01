from app.core.state_manager import (
    get_state, update_state, clear_state,
    add_message, get_history
)


class TestStateManager:
    def setup_method(self):
        clear_state("test_user")

    def test_initial_state_is_none(self):
        assert get_state("test_user") is None

    def test_update_and_get(self):
        update_state("test_user", {"intent": "booking", "slots": {}})
        state = get_state("test_user")
        assert state is not None
        assert state["intent"] == "booking"

    def test_clear_state(self):
        update_state("test_user", {"intent": "booking"})
        clear_state("test_user")
        assert get_state("test_user") is None

    def test_clear_nonexistent_user(self):
        clear_state("nonexistent")  # should not raise

    def test_add_message(self):
        add_message("test_user", "user", "Hello")
        add_message("test_user", "assistant", "Hi there!")
        history = get_history("test_user")
        assert len(history) == 2
        assert history[0]["role"] == "user"
        assert history[1]["content"] == "Hi there!"

    def test_history_cap(self):
        for i in range(25):
            add_message("test_user", "user", f"msg {i}")
        history = get_history("test_user")
        assert len(history) == 20
        assert history[0]["content"] == "msg 5"


class TestRateLimiter:
    def test_allows_normal_usage(self):
        from app.core.rate_limiter import RateLimiter
        limiter = RateLimiter(max_requests=5, window_seconds=60)
        for _ in range(5):
            assert limiter.is_allowed("user1") is True

    def test_blocks_excess(self):
        from app.core.rate_limiter import RateLimiter
        limiter = RateLimiter(max_requests=3, window_seconds=60)
        for _ in range(3):
            limiter.is_allowed("user1")
        assert limiter.is_allowed("user1") is False

    def test_different_users_independent(self):
        from app.core.rate_limiter import RateLimiter
        limiter = RateLimiter(max_requests=2, window_seconds=60)
        limiter.is_allowed("user1")
        limiter.is_allowed("user1")
        assert limiter.is_allowed("user1") is False
        assert limiter.is_allowed("user2") is True
