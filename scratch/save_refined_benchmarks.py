import os
import sys
import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, ".")
from backend.app.model.classifier import MobileNetV3Classifier

clf = MobileNetV3Classifier()
clf.load_checkpoint("backend/models/solarguard_mobilenetv3_50epoch_finetuned.pt")

def make_base_panel():
    img = Image.new('RGB', (448, 448), (22, 36, 66))
    draw = ImageDraw.Draw(img)
    # Cell grid lines (busbars)
    for y in range(0, 448, 112):
        draw.line([(0, y), (448, y)], fill=(180, 195, 215), width=2)
    for x in range(0, 448, 112):
        draw.line([(x, 0), (x, 448)], fill=(180, 195, 215), width=2)
    # fine grid fingers
    for y in range(0, 448, 16):
        draw.line([(0, y), (448, y)], fill=(38, 58, 98), width=1)
    # frame border
    draw.rectangle([(0,0), (447,447)], outline=(145, 155, 165), width=6)
    return img

# 1. Clean
clean_img = make_base_panel()

# 2. Dust
dust_img = make_base_panel()
dust_overlay = Image.new('RGB', (448, 448), (145, 115, 70))
dust_img = Image.blend(dust_img, dust_overlay, 0.55)

# 3. Crack (Sharp jagged fracture lines across cells)
crack_img = make_base_panel()
draw_c = ImageDraw.Draw(crack_img)
points = [(35, 55), (95, 115), (145, 135), (205, 215), (265, 245), (315, 325), (375, 365), (425, 435)]
for i in range(len(points)-1):
    draw_c.line([points[i], points[i+1]], fill=(255, 255, 255), width=3)
# branching cracks
for b in [
    [(145, 135), (195, 105), (255, 98), (295, 65)],
    [(265, 245), (245, 315), (215, 385), (195, 425)],
    [(205, 215), (275, 185), (345, 175), (405, 155)]
]:
    for i in range(len(b)-1):
        draw_c.line([b[i], b[i+1]], fill=(240, 245, 255), width=2)
# circular impact fracture center
draw_c.ellipse([(195, 205), (220, 230)], outline=(255, 255, 255), width=2)

# 4. Bird Droppings (Chalky organic deposits and splatters on blue panel)
bird_img = make_base_panel()
draw_b = ImageDraw.Draw(bird_img)
draw_b.ellipse([(165, 175), (265, 265)], fill=(245, 245, 240))
draw_b.ellipse([(185, 190), (245, 245)], fill=(255, 255, 250))
draw_b.ellipse([(210, 215), (230, 235)], fill=(75, 70, 55))
for (x, y, s) in [
    (135, 155, 14), (145, 215, 11), (155, 285, 13), (275, 165, 15),
    (285, 235, 14), (205, 135, 11), (225, 295, 13), (120, 245, 8),
    (305, 205, 9), (175, 135, 7), (255, 315, 8)
]:
    draw_b.ellipse([(x, y), (x+s, y+s)], fill=(245, 245, 240))

# 5. Snow (Snow accumulation blanket on cells)
snow_img = make_base_panel()
draw_s = ImageDraw.Draw(snow_img)
draw_s.polygon([(0, 180), (65, 160), (145, 190), (245, 150), (345, 200), (448, 170), (448, 448), (0, 448)], fill=(245, 248, 255))
for x in range(20, 440, 40):
    draw_s.ellipse([(x, 150), (x+25, 175)], fill=(240, 245, 255))

samples = {
    "clean.jpg": clean_img,
    "dust.jpg": dust_img,
    "crack.jpg": crack_img,
    "bird_droppings.jpg": bird_img,
    "snow.jpg": snow_img,
}

print("=== CHECKING MOBILENETV3 ON BENCHMARK SET ===")
for filename, img in samples.items():
    # Save to both public dirs
    for d in ["public/samples", "frontend/public/samples"]:
        os.makedirs(d, exist_ok=True)
        img.save(os.path.join(d, filename), quality=92)
    res = clf.predict(img)
    print(f"Saved {filename:<18}: {res['primary_condition']:<16} (conf: {res['confidence']:.3f}) | {res['class_probabilities']}")
