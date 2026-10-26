import os
import sys
sys.path.insert(0, ".")
from PIL import Image
from backend.app.model.groq_vision import classify_surface_with_groq

samples = ["clean.jpg", "dust.jpg", "crack.jpg", "bird_droppings.jpg", "snow.jpg"]

print("=== TESTING GROQ VISION ON ALL 5 SAMPLES ===")
for s in samples:
    path = os.path.join("public/samples", s)
    img = Image.open(path)
    res = classify_surface_with_groq(img)
    if res:
        print(f"[{s}] -> Condition: {res['primary_condition']} (conf: {res['confidence']:.2f})")
        print(f"      Probs: {res['class_probabilities']}")
        print(f"      Safety: {res['safety_status']} | Wiper: {res['wiper_action']}")
    else:
        print(f"[{s}] -> FAILED / NONE")
