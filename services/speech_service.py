# services/speech_service.py
import os
import requests
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

GROQ_API_URL = "https://api.groq.com/openai/v1/audio/transcriptions"
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

def transcribe_audio(file_content: bytes, filename: str) -> str:
    """
    Transcribes audio using Groq's Whisper API.
    """
    if not GROQ_API_KEY:
        logger.error("GROQ_API_KEY not set")
        return "Error: API Key missing."

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}"
    }

    files = {
        "file": (filename, file_content),
        "model": (None, "whisper-large-v3"),
        "response_format": (None, "json")
    }

    try:
        response = requests.post(GROQ_API_URL, headers=headers, files=files, timeout=60)
        if response.status_code == 200:
            result = response.json()
            return result.get("text", "")
        else:
            logger.error(f"Groq Transcription API Error: {response.status_code} - {response.text}")
            return f"Error from transcription service: {response.status_code}"
    except Exception as e:
        logger.error(f"Transcription Request failed: {e}")
        return f"Transcription request failed: {str(e)}"
