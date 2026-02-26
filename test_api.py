import os
import requests
from dotenv import load_dotenv

load_dotenv()

key = os.getenv("GROQ_API_KEY")
url = "https://api.groq.com/openai/v1/chat/completions"

print(f"Testing with key: {key[:10]}...{key[-5:]}")

response = requests.post(
    url,
    headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
    json={
        "model": "llama-3.3-70b-versatile",
        "messages": [{"role": "user", "content": "Hello"}],
        "max_tokens": 10
    }
)

print(f"Status: {response.status_code}")
print(f"Response: {response.text}")
