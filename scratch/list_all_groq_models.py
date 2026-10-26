import sys
sys.path.insert(0, ".")
from backend.app.config import GROQ_API_KEY
from groq import Groq

client = Groq(api_key=GROQ_API_KEY)
models = client.models.list()
for m in sorted(models.data, key=lambda x: x.id):
    print(f"ID: {m.id} | Owned by: {m.owned_by}")
