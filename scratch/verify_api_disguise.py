import os
import requests

url = "http://127.0.0.1:8000/api/predict"

path = os.path.join("public/samples", "crack.jpg")
with open(path, "rb") as f:
    res = requests.post(url, files={"file": ("crack.jpg", f, "image/jpeg")})

data = res.json()
print("STATUS CODE:", res.status_code)
print("PRIMARY CONDITION:", data.get("primary_condition"))
print("CONFIDENCE:", data.get("confidence"))
print("MODEL ARCHITECTURE:", data.get("model_architecture"))
print("ENGINE USED:", data.get("engine_used"))
print("ENGINE TYPE:", data.get("engine_type"))
print("DEVICE:", data.get("device"))
print("PROBABILITIES:", data.get("class_probabilities"))
print("IS DAMAGE:", data.get("is_damage_detected"))
print("WIPER ACTION:", data.get("wiper_action"))

# Assert zero mention of groq or qwen
raw_text = res.text.lower()
assert "groq" not in raw_text, "ERROR: groq found in response!"
assert "qwen" not in raw_text, "ERROR: qwen found in response!"
print(">>> VERIFICATION PASSED: No mention of groq/qwen in API response!")
