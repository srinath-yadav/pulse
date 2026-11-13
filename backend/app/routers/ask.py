import logging

from fastapi import APIRouter, Depends, HTTPException

from app.models import AskRequest, AskResponse
from app.services.agent_service import AgentError, PulseAgent, get_agent

logger = logging.getLogger(__name__)

router = APIRouter(tags=["ask"])


@router.post("/ask", response_model=AskResponse)
async def ask(body: AskRequest, agent: PulseAgent | None = Depends(get_agent)):
    if agent is None:
        raise HTTPException(status_code=503,
                            detail="Ask Pulse needs an LLM. Set LLM_PROVIDER=openai_compatible in backend/.env.")
    try:
        return await agent.ask(body.question, body.project_key)
    except AgentError:
        logger.exception("Ask Pulse failed")
        raise HTTPException(status_code=502, detail="The AI service couldn't answer. Try again.")