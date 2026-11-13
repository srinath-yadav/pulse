import logging

from fastapi import APIRouter, Depends, HTTPException

from app.models import Project, ProjectReport, ProjectSummary
from app.services.jira_service import jira_service
from app.services.report_service import ReportError, ReportGenerator, get_report_generator
from backend.app.rate_limit import limit_ai_requests

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/projects", tags=["projects"])


def find_project(key: str) -> Project:
    """Shared lookup: returns the project or a 404."""
    project = jira_service.get_project(key)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {key} not found")
    return project


@router.get("", response_model=list[ProjectSummary])
def list_projects():
    return [
        ProjectSummary(
            key=p.key, name=p.name, client=p.client,
            total_issues=len(p.issues),
            blocked=sum(i.status == "Blocked" for i in p.issues),
            done=sum(i.status == "Done" for i in p.issues),
        )
        for p in jira_service.get_projects()
    ]


@router.get("/{key}", response_model=Project)
def get_project(key: str):
    return find_project(key)


@router.post("/{key}/report", response_model=ProjectReport,dependencies=[Depends(limit_ai_requests)])
async def generate_report(key: str, generator: ReportGenerator = Depends(get_report_generator)):
    project = find_project(key)
    try:
        return await generator.generate(project)
    except ReportError:
        logger.exception("Report generation failed for %s", key)
        raise HTTPException(status_code=502, detail="The AI service couldn't produce a report. Try again.")