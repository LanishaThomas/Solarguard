import os
import sys
import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, ".")
from backend.app.model.classifier import MobileNetV3Classifier

clf = MobileNetV3Classifier()
clf.load_checkpoint("backend/models/solarguard_mobilenetv3_50epoch_finetuned.pt")

def make_base_panel():
    img = Image.new('RGB', (448, 448), (22, 34, 62))
    draw = ImageDraw.Draw(img)
    # Cell grid lines (busbars)
    for y in range(0, 448, 112):
        draw.line([(0, y), (448, y)], fill=(180, 190, 210), width=2)
    for x in range(0, 448, 112):
        draw.line([(x, 0), (x, 448)], fill=(180, 190, 210), width=2)
    # fine grid fingers
    for y in range(0, 448, 16):
        draw.line([(0, y), (448, y)], fill=(40, 60, 100), width=1)
    # frame border
    draw.rectangle([(0,0), (447,447)], outline=(140, 150, 160), width=6)
    return img

# Realistic Crack: Sharp jagged fracture lines across the glass and silicon
crack_img = make_base_panel()
draw = ImageDraw.Draw(crack_img)
# Primary jagged fracture
points = [
    (30, 50), (90, 110), (140, 130), (200, 210), (260, 240),
    (310, 320), (370, 360), (420, 430)
]
for i in range(len(points)-1):
    draw.line([points[i], points[i+1]], fill=(245, 250, 255), width=3)
    draw.line([(points[i][0]+1, points[i][1]), (points[i+1][0]+1, points[i+1][1])], fill=(200, 220, 240), width=1)

# Branching micro-cracks
branch1 = [(140, 130), (190, 100), (250, 95), (290, 60)]
for i in range(len(branch1)-1):
    draw.line([branch1[i], branch1[i+1]], fill=(230, 240, 255), width=2)

branch2 = [(260, 240), (240, 310), (210, 380), (190, 420)]
for i in range(len(branch2)-1):
    draw.line([branch2[i], branch2[i+1]], fill=(230, 240, 255), width=2)

branch3 = [(200, 210), (270, 180), (340, 170), (400, 150)]
for i in range(len(branch3)-1):
    draw.line([branch3[i], branch3[i+1]], fill=(220, 235, 250), width=2)

# Spiderweb impact center
draw.ellipse([(190, 200), (215, 225)], outline=(255, 255, 255), width=2)
draw.ellipse([(180, 190), (225, 235)], outline=(210, 230, 250), width=1)

# Realistic Bird Droppings: localized chalky white/grey deposits with splatter on blue panel
bird_img = make_base_panel()
draw_b = ImageDraw.Draw(bird_img)
# Main chalky deposit
draw_b.ellipse([(160, 180), (260, 270)], fill=(240, 238, 232))
draw_b.ellipse([(180, 195), (235, 250)], fill=(255, 255, 250))
# Inner dark spot (undigested seed/matter typical of bird poop)
draw_b.ellipse([(205, 220), (220, 235)], fill=(80, 75, 60))
# Splatter droplets around
splatters = [
    (140, 170, 12), (130, 210, 8), (150, 290, 10), (275, 170, 9),
    (290, 220, 14), (280, 260, 11), (210, 150, 7), (230, 300, 10),
    (170, 140, 5), (250, 320, 6), (115, 240, 6), (310, 240, 7)
]
for (x, y, r) in splatters:
    draw_b.ellipse([(x, y), (x+r, y+r)], fill=(245, 242, 238))

res_crack = clf.predict(crack_img)
res_bird = clf.predict(bird_img)

print(f"Crack image -> ML Model: {res_crack['primary_condition']} (conf: {res_crack['confidence']:.3f})")
print(f"               Sigmoids: {res_crack['class_probabilities']}")
print(f"Bird image  -> ML Model: {res_bird['primary_condition']} (conf: {res_bird['confidence']:.3f})")
print(f"               Sigmoids: {res_bird['class_probabilities']}")
