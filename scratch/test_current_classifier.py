import os
import sys
sys.path.insert(0, ".")
from PIL import Image
from backend.app.model.classifier import MobileNetV3Classifier

classifier = MobileNetV3Classifier()
checkpoint_path = "backend/models/solarguard_mobilenetv3_50epoch_finetuned.pt"
classifier.load_checkpoint(checkpoint_path)

samples = ["clean.jpg", "dust.jpg", "crack.jpg", "bird_droppings.jpg", "snow.jpg"]

print("=== MOBILENETV3 CLASSIFIER CURRENT RUN ===")
for s in samples:
    path = os.path.join("public/samples", s)
    img = Image.open(path)
    res = classifier.predict(img)
    print(f"[{s}] -> Result: {res['primary_condition']} (conf: {res['confidence']:.2f})")
    print(f"      Probs: {res['class_probabilities']}")
