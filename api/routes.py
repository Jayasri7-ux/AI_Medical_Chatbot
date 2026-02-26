# api/routes.py
from fastapi import APIRouter, File, UploadFile, Form, Request, HTTPException
from fastapi.responses import JSONResponse
import base64
import logging
from PIL import Image
import io
from datetime import datetime

from services.extractor import extract_text_from_pdf, extract_text_from_docx, extract_text_from_pptx
from services.llm_service import get_ai_response
from services import history_service

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/sessions")
async def list_sessions():
    return history_service.get_all_sessions()

@router.get("/sessions/{session_id}")
async def get_session_detail(session_id: str):
    return history_service.get_session(session_id)

@router.delete("/sessions")
async def clear_all_history():
    history_service.clear_all()
    return {"status": "success"}

@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    if history_service.delete_session(session_id):
        return {"status": "success"}
    raise HTTPException(status_code=404, detail="Session not found")

@router.post("/upload_and_query")
async def upload_and_query(
    file: UploadFile = File(None),
    query: str = Form(None),
    session_id: str = Form(None),
    language: str = Form("English")
):
    try:
        if not file and not query:
            raise HTTPException(status_code=400, detail="Provide at least a file or a query.")

        encoded_image = None
        mime_type = None
        extracted_text = None

        if file:
            file_content = await file.read()
            if not file_content:
                raise HTTPException(status_code=400, detail="Uploaded file is empty.")

            content_type = file.content_type
            
            if "image" in content_type:
                try:
                    img = Image.open(io.BytesIO(file_content))
                    img.verify()
                except Exception as e:
                    raise HTTPException(status_code=400, detail=f"Invalid image format: {str(e)}")

                encoded_image = base64.b64encode(file_content).decode("utf-8")
                ext = file.filename.split(".")[-1].lower()
                mime_type = "image/png" if ext == "png" else "image/jpeg"
                extracted_text = None
            elif content_type == "application/pdf":
                extracted_text = extract_text_from_pdf(file_content)
            elif content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                extracted_text = extract_text_from_docx(file_content)
            elif content_type == "application/vnd.openxmlformats-officedocument.presentationml.presentation":
                extracted_text = extract_text_from_pptx(file_content)
            else:
                raise HTTPException(status_code=400, detail=f"Unsupported file type: {content_type}")

        # Save user message and get/create session_id
        user_msg_content = query if query else "Attached a file."
        session_id = history_service.save_message(session_id, "user", user_msg_content)

        # Build messages for LLM WITH MEMORY
        session_data = history_service.get_session(session_id)
        messages = []
        
        # Add basic context from previous messages (last 5 for token efficiency)
        for msg in session_data["messages"][-6:-1]: # Exclude the current user msg we just saved
             role = "assistant" if msg["role"] == "ai" else msg["role"]
             messages.append({"role": role, "content": msg["content"]})

        # Add current content
        current_text = ""
        if query:
            current_text += query

        if extracted_text:
            if current_text:
                current_text += "\n\n"
            current_text += "Extracted text from document:\n" + extracted_text

        if not current_text:
             current_text = "Please analyze this document."

        current_content = [{"type": "text", "text": current_text}]
        if encoded_image:
            current_content.append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:{mime_type};base64,{encoded_image}"
                }
            })

        messages.append({"role": "user", "content": current_content})
        
        # Get response
        answer = get_ai_response(messages, language=language)
        
        # Save AI response
        history_service.save_message(session_id, "ai", answer)

        return JSONResponse(status_code=200, content={
            "response": answer,
            "session_id": session_id,
            "timestamp": datetime.now().strftime("%I:%M %p")
        })

    except HTTPException as he:
        raise he
    except Exception as e:
        import traceback
        err_msg = traceback.format_exc()
        logger.error(f"Unexpected error: {str(e)}\n{err_msg}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)} \n {err_msg}")
