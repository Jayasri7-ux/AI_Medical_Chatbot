# services/llm_service.py
import requests
import os
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL_NAME = "llama-3.3-70b-versatile"
def get_ai_response(messages: list, language: str = "English") -> str:
    load_dotenv()
    api_key = os.getenv("GROQ_API_KEY")
    
    if not api_key:
        logger.error("GROQ_API_KEY not set")
        return "Error: API Key missing."

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    # Check if there's any image data in the payload to switch to the vision-capable model
    current_model = MODEL_NAME
    if messages and isinstance(messages[-1].get("content"), list):
        for item in messages[-1]["content"]:
            if item.get("type") == "image_url":
                current_model = "meta-llama/llama-4-scout-17b-16e-instruct"
                break
                
    system_instructions = (
        "You are an AI medical assistant named MediLumina. "
        "Provide helpful but informative answers. "
        f"CRITICAL INSTRUCTION: You MUST reply entirely in the '{language}' language. Do not mix languages. "
        f"If the user asks a question in English but the selected language is '{language}', translate your answer to '{language}'."
    )
    
    formatted_messages = [{"role": "system", "content": system_instructions}] + messages
                
    payload = {
        "model": current_model,
        "messages": formatted_messages,
        "max_tokens": 1024,
        "temperature": 0.5
    }

    try:
        response = requests.post(GROQ_API_URL, json=payload, headers=headers, timeout=60)
        if response.status_code == 200:
            result = response.json()
            return result["choices"][0]["message"]["content"]
        else:
            logger.error(f"Groq API Error: {response.status_code} - {response.text}")
            return f"Error from AI service: {response.status_code}"
    except Exception as e:
        logger.error(f"API Request failed: {e}")
        return f"Request failed: {str(e)}"
