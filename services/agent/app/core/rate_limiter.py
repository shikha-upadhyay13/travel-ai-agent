# app/core/rate_limiter.py

import time
import threading
from collections import defaultdict
from app.config import RATE_LIMIT_MAX, RATE_LIMIT_WINDOW


class RateLimiter:
    def __init__(self, max_requests: int = RATE_LIMIT_MAX, window_seconds: int = RATE_LIMIT_WINDOW):
        self.max_requests = max_requests
        self.window = window_seconds
        self._requests = defaultdict(list)
        self._lock = threading.Lock()

    def is_allowed(self, user_id: str) -> bool:
        now = time.time()
        with self._lock:
            # Clean old entries
            self._requests[user_id] = [
                t for t in self._requests[user_id] if now - t < self.window
            ]
            if len(self._requests[user_id]) >= self.max_requests:
                return False
            self._requests[user_id].append(now)
            return True

    def remaining(self, user_id: str) -> int:
        """Return how many requests the user has left in the current window."""
        now = time.time()
        with self._lock:
            self._requests[user_id] = [
                t for t in self._requests[user_id] if now - t < self.window
            ]
            return max(0, self.max_requests - len(self._requests[user_id]))


rate_limiter = RateLimiter()
