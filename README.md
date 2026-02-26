# MediLumina - AI Medical Chatbot

MediLumina is a premium, modular AI medical assistant powered by FastAPI and Groq (Llama 3.3 70B). It allows users to upload medical documents (PDF, DOCX, PPTX, Images) and receive intelligent insights via a sleek, modern interface.

## ✨ Features
- **Intelligent Response**: Powered by Llama 3.3 70B for high-quality medical analysis.
- **Document Analysis**: Supports PDF, DOCX, PPTX, and Image extractions.
- **Premium UI**: Modern glassmorphism design with a professional medical theme.
- **Persistent History**: Saves your conversations locally in the browser.
- **Voice-to-Text**: Dictate your medical queries for hands-free interaction.
- **Modular Codebase**: Clean separation of concerns (API, Services, Frontend).

## 🚀 How to Run

### 1. Prerequisites
- Python 3.8+
- Groq API Key (Place in `.env` file)

### 2. Installation
```powershell
# Clone the repository (if applicable)
# Navigate to project folder
cd ai_medical_chatbot

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Setup Environment
Create a `.env` file in the root directory:
```env
GROQ_API_KEY=your_key_here
```

### 4. Run Application
```powershell
python main.py
```
The application will be available at `http://127.0.0.1:9000`.

## 📂 Project Structure
- `api/`: FastAPI route handlers.
- `services/`: Core logic for text extraction and LLM interaction.
- `static/`: Frontend assets (CSS, JS).
- `templates/`: HTML templates.
- `main.py`: Entry point for the application.

## 🔒 GitHub Access Control
To remove others' access from your GitHub repository:
1. Go to your repository on [GitHub](https://github.com).
2. Click on **Settings** (top tab).
3. Select **Collaborators** from the left sidebar.
4. Remove any users you no longer wish to have access by clicking the "Remove" button next to their name.

---
*Disclaimer: MediLumina is for informational purposes only. Always consult a qualified healthcare professional for medical advice.*