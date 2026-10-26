import os
import sys
import numpy as np
import torch
from PIL import Image

sys.path.insert(0, ".")
from backend.app.model.classifier import MobileNetV3Classifier
from backend.app.utils.image_processing import preprocess_image

clf = MobileNetV3Classifier()
clf.load_checkpoint("backend/models/solarguard_mobilenetv3_50epoch_finetuned.pt")

samples = ["clean.jpg", "dust.jpg", "crack.jpg", "bird_droppings.jpg", "snow.jpg"]

def predict_clean_logic(img, active_thresh=0.50):
    tensor = preprocess_image(img, clf.device)
    with torch.no_grad():
        logits = clf.model(tensor)
        sigmoids = torch.sigmoid(logits).squeeze(0).cpu().numpy()
    
    class_sigmoids = {cls_name: round(float(sigmoids[i]), 4) for i, cls_name in enumerate(clf.classes)}
    
    img_arr = np.array(img.convert("RGB")).astype(np.float32)
    mean_lum = float(img_arr.mean())
    std_lum = float(img_arr.std())
    warmth = float(img_arr[:, :, 0].mean() - img_arr[:, :, 2].mean())
    
    is_flat_white = mean_lum > 220 and std_lum < 25
    
    # Snow requires bright surface (high albedo) and cool/neutral tint
    # If surface is dark (mean_lum < 130) or warm (warmth > 8), it cannot physically be snow
    is_physically_snow = (mean_lum >= 130) and (warmth <= 8)
    if not is_physically_snow and class_sigmoids.get("snow", 0.0) > 0.35:
        # Suppress out-of-distribution snow neuron without forcing dust
        class_sigmoids["snow"] = round(min(class_sigmoids["snow"], 0.20), 4)
    
    # If flat white wall or paper (no solar cell structure)
    if is_flat_white:
        return "clean", 0.95, class_sigmoids
    
    defect_classes = [c for c in clf.classes if c != "clean"]
    best_defect = max(defect_classes, key=lambda c: class_sigmoids.get(c, 0.0))
    best_defect_prob = class_sigmoids.get(best_defect, 0.0)
    
    if best_defect_prob >= active_thresh:
        return best_defect, best_defect_prob, class_sigmoids
    else:
        clean_prob = class_sigmoids.get("clean", round(1.0 - best_defect_prob, 4))
        return "clean", max(clean_prob, round(1.0 - best_defect_prob, 4)), class_sigmoids

print("=== CLEAN LOGIC TEST ON PUBLIC SAMPLES ===")
for s in samples:
    path = os.path.join("public/samples", s)
    img = Image.open(path)
    cond, conf, sigs = predict_clean_logic(img)
    print(f"[{s:<18}] -> {cond:<15} (conf: {conf:.3f}) | sigmoids: {sigs}")
