import os
import requests

url = "http://127.0.0.1:8000/api/predict"

samples = ["clean.jpg", "dust.jpg", "crack.jpg", "bird_droppings.jpg", "snow.jpg"]

print("=== TESTING HTTP ENDPOINT WITH MOBILENETV3 ===")
for s in samples:
    path = os.path.join("public/samples", s)
    with open(path, "rb") as f:
        res = requests.post(f"{url}?engine=mobilenetv3", files={"file": (s, f, "image/jpeg")})
    data = res.json()
    print(f"[{s:<18}] -> {data.get('primary_condition'):<15} (conf: {data.get('confidence'):.2f}) | Engine: {data.get('engine_used')}")
    print(f"       Probs: {data.get('class_probabilities')}")
