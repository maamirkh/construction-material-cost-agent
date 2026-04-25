import os, requests
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("GEMINI_API_KEY", "").strip()
print(f"Loaded key: {key[:20]}...{key[-4:]}")

# Direct test without openai package
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"
r = requests.get(url)
print(f"Status: {r.status_code}")
if r.status_code == 200:
    models = [m['name'] for m in r.json().get('models', [])]
    print("Available models:")
    for m in models:
        print(f"  {m}")
else:
    print(f"Error: {r.json()}")
