import glob
import os
import sys
from PIL import Image
import numpy as np

sys.path.insert(0, ".")
from backend.app.model.classifier import MobileNetV3Classifier

clf = MobileNetV3Classifier()
clf.load_checkpoint("backend/models/solarguard_mobilenetv3_50epoch_finetuned.pt")

uploaded = glob.glob(r"C:\Users\Lanisha\.gemini\antigravity-ide\brain\28fcb83f-c9eb-44bb-8ff7-6bb5f78aca45\.user_uploaded\*.*")

for u in uploaded:
    img = Image.open(u).convert("RGB")
    res = clf.predict(img)
    print(f"File: {os.path.basename(u)} {img.size}")
    print(f"  Result: {res['primary_condition']} (conf: {res['confidence']:.3f})")
    print(f"  Sigmoids: {res['class_probabilities']}")
