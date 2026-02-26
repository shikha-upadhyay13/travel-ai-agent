from fastapi import APIRouter
from pydantic import BaseModel
from app.services.llm_service import extract_intent

router = APIRouter()

class ChatRequest(BaseModel):
    user_id: str
    message: str

@router.post("/chat")
async def chat(request: ChatRequest):

    structured = await extract_intent(request.message)

    return structured