import sys
from PIL import Image, ImageDraw

sys.path.insert(0, ".")
from backend.app.config import GROQ_API_KEY
from backend.app.model.groq_vision import image_to_base64_jpeg
from groq import Groq

client = Groq(api_key=GROQ_API_KEY, max_retries=0)

balanced_prompt = (
    "You are an expert optical inspector for solar panel surface conditions and maintenance diagnostics. "
    "Analyze the image or camera frame carefully and determine the condition of the solar panel surface.\n\n"
    "Identify EXACTLY ONE primary condition from these 5 categories:\n"
    "- 'crack': Physical structural fractures, broken panel glass, shattered photovoltaic cells, impact cracks, branching cracks, or micro-cracks (CRITICAL MECHANICAL DAMAGE).\n"
    "- 'bird_droppings': Bird droppings / bird poop, whitish or greyish splattered organic deposits, or localized chalky fecal spots on the glass.\n"
    "- 'snow': Snow layer, snow coverage, frost, ice sheets, or white winter snow accumulation blocking the cells.\n"
    "- 'dust': Soil dust accumulation, sand deposition, brownish/yellowish dirt layer, silt, or particulate soiling.\n"
    "- 'clean': Spotless, clear, pristine solar panel surface with no significant dirt, cracks, droppings, or snow.\n\n"
    "Respond ONLY with a JSON object in this exact schema:\n"
    "{\n"
    "  \"condition\": \"crack\" | \"bird_droppings\" | \"snow\" | \"dust\" | \"clean\",\n"
    "  \"confidence\": float between 0.70 and 0.99,\n"
    "  \"reason\": \"brief 1-sentence technical explanation of visible surface evidence\"\n"
    "}"
)

# Solar panel with bird droppings
img = Image.new('RGB', (448, 448), (20, 35, 65))
draw = ImageDraw.Draw(img)
for y in range(0, 448, 112):
    draw.line([(0, y), (448, y)], fill=(180, 190, 210), width=2)
for x in range(0, 448, 112):
    draw.line([(x, 0), (x, 448)], fill=(180, 190, 210), width=2)

# Chalky bird fecal splatter
draw.ellipse([(170, 170), (270, 260)], fill=(245, 245, 240))
draw.ellipse([(190, 185), (250, 240)], fill=(255, 255, 250))
draw.ellipse([(215, 210), (235, 230)], fill=(70, 65, 50))
splats = [(130, 150, 15), (140, 210, 12), (150, 280, 14), (280, 160, 16), (290, 230, 15), (210, 130, 12), (230, 290, 14)]
for (x,y,s) in splats:
    draw.ellipse([(x,y), (x+s, y+s)], fill=(245, 245, 240))

b64 = image_to_base64_jpeg(img, max_dim=384)

completion = client.chat.completions.create(
    model="qwen/qwen3.8-27b",
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": balanced_prompt},
            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}}
        ]
    }],
    temperature=0.0,
    max_tokens=200,
    response_format={"type": "json_object"},
    timeout=10.0
)
print("BIRD DROPPINGS RESULT:", completion.choices[0].message.content)
