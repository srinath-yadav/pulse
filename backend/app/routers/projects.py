from fastapi import APIRouter, HTTPException
from app.models import Project, ProjectSummary
from app.services.jira_service import jira_service

router = APIRouter(prefix="/projects", tags=["projects"])

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
    project = jira_service.get_project(key)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {key} not found")
    return project