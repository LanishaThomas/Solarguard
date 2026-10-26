import os
from PIL import Image
import numpy as np

samples = ["clean.jpg", "dust.jpg", "crack.jpg", "bird_droppings.jpg", "snow.jpg"]

for s in samples:
    p = os.path.join("public/samples", s)
    img = Image.open(p)
    arr = np.array(img)
    print(f"[{s}] shape={arr.shape}, mean RGB={arr.mean(axis=(0,1)).astype(int).tolist()}, min={arr.min()}, max={arr.max()}")
