# app/core/slot_manager.py

import re
from datetime import datetime, timedelta
from typing import Dict, List

REQUIRED_FIELDS = ["mode", "source", "destination", "date"]

MODE_ALIASES = {
    "flight": "flight", "fly": "flight", "plane": "flight", "air": "flight",
    "airplane": "flight", "aeroplane": "flight", "flights": "flight",
    "train": "train", "rail": "train", "railway": "train", "trains": "train",
    "bus": "bus", "coach": "bus", "buses": "bus",
}

# Patterns that look like valid dates
DATE_PATTERNS = [
    r"\d{4}-\d{1,2}-\d{1,2}",       # 2026-03-30
    r"\d{1,2}[/-]\d{1,2}[/-]\d{2,4}", # 30/03/2026 or 30-03-26
    r"\d{1,2}\s+\w+\s+\d{2,4}",     # 30 March 2026
    r"\w+\s+\d{1,2},?\s*\d{2,4}",   # March 30, 2026
    r"\d{1,2}\s+\w+",               # 30 March
    r"\w+\s+\d{1,2}",               # March 30
]

RELATIVE_DATES = {"today", "tomorrow", "day after tomorrow", "next week", "next monday",
                  "next tuesday", "next wednesday", "next thursday", "next friday",
                  "next saturday", "next sunday"}

DAY_MAP = {
    "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
    "friday": 4, "saturday": 5, "sunday": 6
}


def normalize_mode(mode: str) -> str:
    if not mode:
        return ""
    return MODE_ALIASES.get(mode.strip().lower(), mode.strip().lower())


def validate_date(date: str) -> bool:
    if not date:
        return False
    date_lower = date.strip().lower()
    if date_lower in RELATIVE_DATES:
        return True
    for pattern in DATE_PATTERNS:
        if re.search(pattern, date, re.IGNORECASE):
            return True
    return False


def resolve_date(date: str) -> str:
    """Convert relative dates like 'tomorrow' to actual date strings."""
    if not date:
        return date
    date_lower = date.strip().lower()
    today = datetime.now()

    if date_lower == "today":
        return today.strftime("%Y-%m-%d")
    elif date_lower == "tomorrow":
        return (today + timedelta(days=1)).strftime("%Y-%m-%d")
    elif date_lower == "day after tomorrow":
        return (today + timedelta(days=2)).strftime("%Y-%m-%d")
    elif date_lower == "next week":
        return (today + timedelta(weeks=1)).strftime("%Y-%m-%d")
    elif date_lower.startswith("next "):
        day_name = date_lower.replace("next ", "").strip()
        if day_name in DAY_MAP:
            target_day = DAY_MAP[day_name]
            current_day = today.weekday()
            days_ahead = target_day - current_day
            if days_ahead <= 0:
                days_ahead += 7
            return (today + timedelta(days=days_ahead)).strftime("%Y-%m-%d")

    return date


def normalize_city(city: str) -> str:
    """Capitalize city names properly."""
    if not city:
        return ""
    return city.strip().title()


def initialize_slots(structured: Dict) -> Dict:
    date_val = structured.get("date", "")
    if date_val and not validate_date(date_val):
        date_val = ""

    return {
        "mode": normalize_mode(structured.get("mode", "")),
        "source": normalize_city(structured.get("source", "")),
        "destination": normalize_city(structured.get("destination", "")),
        "date": date_val,
        "time": structured.get("time", ""),
    }


def merge_slots(existing_slots: Dict, new_slots: Dict) -> Dict:
    for key, value in new_slots.items():
        if value:
            if key == "mode":
                existing_slots[key] = normalize_mode(value)
            elif key == "date":
                if validate_date(value):
                    existing_slots[key] = value
            elif key in ("source", "destination"):
                existing_slots[key] = normalize_city(value)
            else:
                existing_slots[key] = value
    return existing_slots


def check_missing_slots(slots: Dict) -> List[str]:
    missing = []
    for field in REQUIRED_FIELDS:
        if not slots.get(field):
            missing.append(field)
    return missing


def generate_missing_prompt(missing_fields: List[str]) -> str:
    readable = {
        "mode": "travel type (flight/train/bus)",
        "source": "departure city",
        "destination": "destination city",
        "date": "travel date (e.g. March 30, tomorrow)",
        "time": "preferred time"
    }

    questions = [readable.get(field, field) for field in missing_fields]

    return "I need the following details: " + ", ".join(questions)


def format_booking_summary(slots: Dict) -> str:
    """Create a human-readable booking summary."""
    mode = slots.get("mode", "")
    source = slots.get("source", "")
    destination = slots.get("destination", "")
    date = resolve_date(slots.get("date", ""))
    time = slots.get("time", "")

    summary = f"{mode}s from {source} to {destination} on {date}"
    if time:
        summary += f" around {time}"
    return summary
