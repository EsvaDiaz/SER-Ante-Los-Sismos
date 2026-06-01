from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.services.ai_service import generate_response
from backend.models import UserInDB

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

# Autenticación opcional — retorna usuario anónimo si no hay token
async def get_optional_user(token: str = "") -> UserInDB:
    return UserInDB(email="web_anonymous@example.com", full_name="Usuario Web")

@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest):
    """
    Endpoint principal para el chat con la IA.
    Llama al servicio de IA (Ollama) con contexto sísmico.
    """
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="El mensaje no puede estar vacío.")

    # Tratar de obtener un contexto de usuario genérico (anonymous)
    user = UserInDB(email="web_user@example.com", full_name="Usuario Web")

    try:
        ai_response = await generate_response(user, request.message.strip())
        return ChatResponse(response=ai_response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al conectar con el servicio de IA: {str(e)}")
