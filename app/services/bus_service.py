import hashlib
import random


def search_buses(source: str, destination: str, date: str):
    operators = [
        "KSRTC", "APSRTC", "VRL Travels", "Orange Travels",
        "SRS Travels", "MSRTC", "TSRTC"
    ]
    bus_types = ["Volvo AC", "Semi-Sleeper", "Sleeper", "AC Sleeper", "Non-AC Seater"]

    seed = int(hashlib.md5(f"{source}{destination}{date}".lower().encode()).hexdigest(), 16) % (10**9)
    rng = random.Random(seed)

    buses = []
    for i in range(3):
        dep_hour = 18 + i * 2
        duration = rng.randint(5, 12)
        bus = {
            "bus_id": f"BUS-{rng.randint(1000, 9999)}",
            "operator": rng.choice(operators),
            "departure_time": f"{dep_hour:02d}:00",
            "arrival_time": f"{(dep_hour + duration) % 24:02d}:{rng.choice(['00', '30'])}",
            "bus_type": rng.choice(bus_types),
            "price": rng.randint(400, 2500)
        }
        buses.append(bus)

    return buses
