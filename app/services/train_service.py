import hashlib
import random


def search_trains(source: str, destination: str, date: str):
    train_names = [
        "Rajdhani Express", "Shatabdi Express", "Duronto Express",
        "Garib Rath Express", "Vande Bharat Express", "Humsafar Express"
    ]
    classes = ["1AC", "2AC", "3AC", "Sleeper", "Chair Car"]

    seed = int(hashlib.md5(f"{source}{destination}{date}".lower().encode()).hexdigest(), 16) % (10**9)
    rng = random.Random(seed)

    trains = []
    used_names = set()
    for i in range(3):
        name = rng.choice([n for n in train_names if n not in used_names] or train_names)
        used_names.add(name)
        dep_hour = 6 + i * 4
        duration = rng.randint(4, 12)
        train = {
            "train_id": f"TR-{rng.randint(10000, 99999)}",
            "train_name": name,
            "departure_time": f"{dep_hour:02d}:00",
            "arrival_time": f"{(dep_hour + duration) % 24:02d}:{rng.choice(['00', '30'])}",
            "class": rng.choice(classes),
            "price": rng.randint(500, 4000)
        }
        trains.append(train)

    return trains
