# app/core/state_manager.py

import threading
from typing import Dict, Optional

MAX_HISTORY = 20

_lock = threading.Lock()
_conversation_store: Dict[str, dict] = {}


def get_state(user_id: str) -> Optional[dict]:
    with _lock:
        state = _conversation_store.get(user_id)
        return dict(state) if state else None


def update_state(user_id: str, state: dict):
    with _lock:
        _conversation_store[user_id] = state


def add_message(user_id: str, role: str, content: str):
    with _lock:
        if user_id not in _conversation_store:
            _conversation_store[user_id] = {"history": []}
        if "history" not in _conversation_store[user_id]:
            _conversation_store[user_id]["history"] = []

        _conversation_store[user_id]["history"].append({"role": role, "content": content})

        if len(_conversation_store[user_id]["history"]) > MAX_HISTORY:
            _conversation_store[user_id]["history"] = _conversation_store[user_id]["history"][-MAX_HISTORY:]


def get_history(user_id: str) -> list:
    with _lock:
        state = _conversation_store.get(user_id, {})
        return list(state.get("history", []))


def clear_state(user_id: str):
    with _lock:
        _conversation_store.pop(user_id, None)
