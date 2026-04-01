import hashlib
import random


def search_flights(source: str, destination: str, date: str):
    airlines = ["IndiGo", "Air India", "SpiceJet", "Vistara"]

    # Seed with query params so same search = same results
    seed = int(hashlib.md5(f"{source}{destination}{date}".lower().encode()).hexdigest(), 16) % (10**9)
    rng = random.Random(seed)

    flights = []
    for i in range(3):
        dep_hour = 6 + i * 3
        duration = rng.randint(2, 5)
        flight = {
            "flight_id": f"FL-{rng.randint(1000, 9999)}",
            "airline": rng.choice(airlines),
            "departure_time": f"{dep_hour:02d}:00",
            "arrival_time": f"{dep_hour + duration:02d}:{rng.choice(['00', '30'])}",
            "price": rng.randint(3500, 8000)
        }
        flights.append(flight)

    return flights
