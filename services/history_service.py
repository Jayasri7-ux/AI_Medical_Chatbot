# services/history_service.py
import json
import os
from datetime import datetime
import uuid

HISTORY_FILE = "data/chat_history.json"

def _load_history():
    if not os.path.exists(HISTORY_FILE):
        return {}
    try:
        with open(HISTORY_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return {}

def _save_history(history):
    os.makedirs(os.path.dirname(HISTORY_FILE), exist_ok=True)
    with open(HISTORY_FILE, "w") as f:
        json.dump(history, f, indent=2)

def get_all_sessions():
    history = _load_history()
    sessions = []
    for session_id, data in history.items():
        sessions.append({
            "id": session_id,
            "title": data.get("title", "New Conversation"),
            "timestamp": data.get("last_updated", "")
        })
    # Sort by recent
    return sorted(sessions, key=lambda x: x["timestamp"], reverse=True)

def get_session(session_id):
    history = _load_history()
    return history.get(session_id, {"messages": [], "title": "New Conversation"})

def save_message(session_id, role, content):
    history = _load_history()
    
    if session_id not in history:
        session_id = str(uuid.uuid4())
        history[session_id] = {
            "title": content[:30] + "..." if len(content) > 30 else content,
            "created_at": datetime.now().isoformat(),
            "messages": []
        }
    
    timestamp = datetime.now().strftime("%I:%M %p")
    history[session_id]["messages"].append({
        "role": role,
        "content": content,
        "timestamp": timestamp
    })
    history[session_id]["last_updated"] = datetime.now().isoformat()
    
    _save_history(history)
    return session_id

def delete_session(session_id):
    history = _load_history()
    if session_id in history:
        del history[session_id]
        _save_history(history)
        return True
    return False

def clear_all():
    _save_history({})
