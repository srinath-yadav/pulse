from pydantic import BaseModel
from typing import Literal
from pydantic import BaseModel, Field

class Issue(BaseModel):
    key : str
    summary : str
    status : Literal["To Do","In Progress","Blocked","Done"]
    priority : Literal["Low","Medium","High","Critical"]
    assignee : str | None = None
    story_points : int | None = None
    days_open : int
   
 
class Project(BaseModel):
    key : str
    name : str
    client : str 
    issues : list[Issue]
    

class ProjectSummary(BaseModel):
    key : str
    name : str
    client : str
    total_issues : int
    blocked : int
    done : int
    

class ProjectReport(BaseModel):
    """AI status report. The limits protect the UI from odd LLM output."""

    summary: str = Field(max_length=600)
    blockers: list[str] = Field(default_factory=list, max_length=5)
    risk_level: Literal["low", "medium", "high"]
    est_completion_days: int = Field(ge=0, le=365)