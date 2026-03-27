# app/core/rate_limiter.py

import time
import threading
from collections import defaultdict


class RateLimiter:
    def __init__(self, max_requests: int = 20, window_seconds: int = 60):
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


rate_limiter = RateLimiter()
