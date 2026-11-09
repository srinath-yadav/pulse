from pydantic import BaseModel
from typing import Literal

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