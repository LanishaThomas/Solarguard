import os
import sys
import time
import io
import base64
import json
from PIL import Image

sys.path.insert(0, ".")
from backend.app.config import GROQ_API_KEY
from groq import Groq

client = Groq(api_key=GROQ_API_KEY, max_retries=0)

def image_to_base64_jpeg(image: Image.Image, max_dim: int = 280) -> str:
    img = image.convert("RGB")
    width, height = img.size
    if width > max_dim or height > max_dim:
        if width > height:
            height = int((height * max_dim) / width)
            width = max_dim
        else:
            width = int((width * max_dim) / height)
            height = max_dim
        img = img.resize((width, height), Image.Resampling.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85, optimize=True)
    return base64.b64encode(buf.getvalue()).decode("utf-8")

balanced_prompt = (
    "You are SolarGuard's optical solar panel surface defect inspector. "
    "Carefully analyze this solar panel inspection image or camera frame and identify the surface condition.\n\n"
    "Classify into EXACTLY ONE of these 5 mutually-exclusive categories:\n"
    "1. 'crack': Physical structural cracks, fractured glass, shattered cells, hair-line cracks, or impact fissures (CRITICAL DAMAGE).\n"
    "2. 'bird_droppings': Bird feces, droppings, whitish/chalky splatters, bird poop, or localized opaque stains.\n"
    "3. 'snow': Snow layer, snow coverage, frost, ice patches, or white winter snow blanket.\n"
    "4. 'dust': Soil dust, sand accumulation, dirty haze, brown silt, particulate soiling, or grime covering the panel.\n"
    "5. 'clean': Clean, clear, undamaged, normal solar panel surface with no significant dirt, cracks, droppings, or snow.\n\n"
    "Return JSON ONLY with this format:\n"
    "{\n"
    "  \"condition\": \"crack\" | \"bird_droppings\" | \"snow\" | \"dust\" | \"clean\",\n"
    "  \"confidence\": 0.70 to 0.99,\n"
    "  \"reason\": \"brief explanation of visual evidence observed\"\n"
    "}"
)

samples = ["clean.jpg", "dust.jpg", "crack.jpg", "bird_droppings.jpg", "snow.jpg"]

print("=== TESTING TOKEN-OPTIMIZED BALANCED GROQ VISION ===")
for s in samples:
    path = os.path.join("public/samples", s)
    img = Image.open(path)
    b64_img = image_to_base64_jpeg(img, max_dim=280)
    
    try:
        t0 = time.perf_counter()
        completion = client.chat.completions.create(
            model="qwen/qwen3.8-27b",
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": balanced_prompt},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64_img}"}}
                ]
            }],
            temperature=0.0,
            max_tokens=150,
            response_format={"type": "json_object"},
            timeout=8.0
        )
        dt = (time.perf_counter() - t0) * 1000
        usage = completion.usage
        content = completion.choices[0].message.content
        data = json.loads(content)
        print(f"[{s}] -> {data.get('condition')} (conf: {data.get('confidence')}) in {dt:.0f}ms | Tokens: prompt={usage.prompt_tokens}, total={usage.total_tokens}")
        print(f"       Reason: {data.get('reason')}")
    except Exception as e:
        print(f"[{s}] -> ERROR: {e}")
    time.sleep(1) # brief pause
