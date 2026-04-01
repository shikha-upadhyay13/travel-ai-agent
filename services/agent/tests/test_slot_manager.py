from datetime import datetime, timedelta
from app.core.slot_manager import (
    normalize_mode,
    validate_date,
    resolve_date,
    normalize_city,
    initialize_slots,
    merge_slots,
    check_missing_slots,
    generate_missing_prompt,
    format_booking_summary,
)


class TestNormalizeMode:
    def test_flight_aliases(self):
        for alias in ["flight", "fly", "plane", "air", "airplane", "flights"]:
            assert normalize_mode(alias) == "flight"

    def test_train_aliases(self):
        for alias in ["train", "rail", "railway", "trains"]:
            assert normalize_mode(alias) == "train"

    def test_bus_aliases(self):
        for alias in ["bus", "coach", "buses"]:
            assert normalize_mode(alias) == "bus"

    def test_case_insensitive(self):
        assert normalize_mode("FLIGHT") == "flight"
        assert normalize_mode("Train") == "train"

    def test_empty(self):
        assert normalize_mode("") == ""
        assert normalize_mode(None) == ""

    def test_unknown_mode(self):
        assert normalize_mode("helicopter") == "helicopter"


class TestValidateDate:
    def test_iso_format(self):
        assert validate_date("2026-03-30") is True

    def test_slash_format(self):
        assert validate_date("30/03/2026") is True

    def test_natural_format(self):
        assert validate_date("30 March 2026") is True
        assert validate_date("March 30, 2026") is True

    def test_relative_dates(self):
        assert validate_date("today") is True
        assert validate_date("tomorrow") is True
        assert validate_date("next monday") is True

    def test_invalid(self):
        assert validate_date("") is False
        assert validate_date("abc") is False

    def test_partial_date(self):
        assert validate_date("March 30") is True
        assert validate_date("30 March") is True


class TestResolveDate:
    def test_today(self):
        result = resolve_date("today")
        expected = datetime.now().strftime("%Y-%m-%d")
        assert result == expected

    def test_tomorrow(self):
        result = resolve_date("tomorrow")
        expected = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        assert result == expected

    def test_day_after_tomorrow(self):
        result = resolve_date("day after tomorrow")
        expected = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")
        assert result == expected

    def test_next_week(self):
        result = resolve_date("next week")
        expected = (datetime.now() + timedelta(weeks=1)).strftime("%Y-%m-%d")
        assert result == expected

    def test_absolute_date_unchanged(self):
        assert resolve_date("2026-03-30") == "2026-03-30"
        assert resolve_date("March 30, 2026") == "March 30, 2026"

    def test_empty(self):
        assert resolve_date("") == ""


class TestNormalizeCity:
    def test_basic(self):
        assert normalize_city("delhi") == "Delhi"
        assert normalize_city("MUMBAI") == "Mumbai"
        assert normalize_city("new delhi") == "New Delhi"

    def test_empty(self):
        assert normalize_city("") == ""
        assert normalize_city(None) == ""


class TestInitializeSlots:
    def test_basic(self):
        result = initialize_slots({
            "mode": "fly",
            "source": "delhi",
            "destination": "mumbai",
            "date": "tomorrow",
        })
        assert result["mode"] == "flight"
        assert result["source"] == "Delhi"
        assert result["destination"] == "Mumbai"
        assert result["date"] == "tomorrow"

    def test_invalid_date_cleared(self):
        result = initialize_slots({"date": "xyz123"})
        assert result["date"] == ""

    def test_missing_fields_default_empty(self):
        result = initialize_slots({})
        assert result["mode"] == ""
        assert result["source"] == ""


class TestMergeSlots:
    def test_merges_non_empty(self):
        existing = {"mode": "flight", "source": "", "destination": "", "date": ""}
        new = {"mode": "", "source": "Delhi", "destination": "Mumbai", "date": ""}
        result = merge_slots(existing, new)
        assert result["mode"] == "flight"
        assert result["source"] == "Delhi"

    def test_overwrites_with_new(self):
        existing = {"mode": "flight", "source": "Delhi", "destination": "", "date": ""}
        new = {"mode": "", "source": "bangalore", "destination": "", "date": ""}
        result = merge_slots(existing, new)
        assert result["source"] == "Bangalore"

    def test_invalid_date_not_merged(self):
        existing = {"mode": "", "source": "", "destination": "", "date": "tomorrow"}
        new = {"mode": "", "source": "", "destination": "", "date": "xyz"}
        result = merge_slots(existing, new)
        assert result["date"] == "tomorrow"


class TestCheckMissingSlots:
    def test_all_missing(self):
        missing = check_missing_slots({"mode": "", "source": "", "destination": "", "date": ""})
        assert len(missing) == 4

    def test_none_missing(self):
        missing = check_missing_slots({
            "mode": "flight", "source": "Delhi",
            "destination": "Mumbai", "date": "tomorrow"
        })
        assert missing == []

    def test_partial(self):
        missing = check_missing_slots({
            "mode": "flight", "source": "Delhi",
            "destination": "", "date": ""
        })
        assert "destination" in missing
        assert "date" in missing
        assert "mode" not in missing


class TestGenerateMissingPrompt:
    def test_single_field(self):
        prompt = generate_missing_prompt(["date"])
        assert "travel date" in prompt

    def test_multiple_fields(self):
        prompt = generate_missing_prompt(["source", "destination"])
        assert "departure city" in prompt
        assert "destination city" in prompt


class TestFormatBookingSummary:
    def test_basic_summary(self):
        slots = {
            "mode": "flight",
            "source": "Delhi",
            "destination": "Mumbai",
            "date": "2026-03-30",
            "time": "",
        }
        summary = format_booking_summary(slots)
        assert "flight" in summary
        assert "Delhi" in summary
        assert "Mumbai" in summary
        assert "2026-03-30" in summary

    def test_with_time(self):
        slots = {
            "mode": "train",
            "source": "Chennai",
            "destination": "Bangalore",
            "date": "tomorrow",
            "time": "morning",
        }
        summary = format_booking_summary(slots)
        assert "train" in summary
        assert "morning" in summary
