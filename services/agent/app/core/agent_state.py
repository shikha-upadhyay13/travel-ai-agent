# Agent State Machine for YatraAI
# States: IDLE → THINKING → SEARCHING → PRESENTING → CONFIRMING → COMPLETED → SUGGESTING

from enum import Enum
from typing import Optional


class AgentState(str, Enum):
    IDLE = "IDLE"
    THINKING = "THINKING"
    SEARCHING = "SEARCHING"
    PRESENTING = "PRESENTING"
    CONFIRMING = "CONFIRMING"
    PAYING = "PAYING"
    COMPLETED = "COMPLETED"
    SUGGESTING = "SUGGESTING"
    ERROR = "ERROR"


class MessageType(str, Enum):
    TEXT = "text"
    TRAIN_RESULTS = "train_results"
    BUS_RESULTS = "bus_results"
    FLIGHT_RESULTS = "flight_results"
    BOOKING_STATUS = "booking_status"
    STAY_SUGGESTIONS = "stay_suggestions"
    CHIPS = "chips"
    STATUS = "status"  # Agent status messages like "Searching..."


def make_text_message(content: str) -> dict:
    return {
        "role": "assistant",
        "content": content,
        "message_type": MessageType.TEXT,
        "metadata": None,
    }


def make_card_message(card_type: str, data: dict) -> dict:
    return {
        "role": "assistant",
        "content": None,
        "message_type": card_type,
        "metadata": data,
    }


def make_chips_message(options: list[str]) -> dict:
    return {
        "role": "assistant",
        "content": None,
        "message_type": MessageType.CHIPS,
        "metadata": {"chips": options},
    }


def make_status_message(label: str) -> dict:
    return {
        "role": "assistant",
        "content": label,
        "message_type": MessageType.STATUS,
        "metadata": None,
    }


def make_agent_response(
    agent_state: AgentState,
    messages: list[dict],
    session: Optional[dict] = None,
) -> dict:
    """Build the structured response the Next.js frontend expects."""
    return {
        "agent_state": agent_state.value,
        "messages": messages,
        "session": session or {},
    }
