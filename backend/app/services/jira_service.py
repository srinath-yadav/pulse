import json
from pathlib import Path
from app.models import Project

DATA_FILE = Path(__file__).parent.parent / "data" / "sample_issues.json"


class JiraService:
    """ Read jira data. Sample JSON for now; Swap in real JIRA REST API later. """
    
    def get_projects(self) -> list[Project]:
        raw = json.loads(DATA_FILE.read_text())
        return [Project(**p) for p in raw]
    
    def get_project(self, key:str)->Project | None:
        return next((p for p in self.get_projects() if p.key == key.upper()),None)
    
    def get_blocked(self,key:str)->Project | None:
        return next((p.issues() for p in self.get_projects() ))

jira_service = JiraService()
    