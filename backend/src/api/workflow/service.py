import json

from src.core.workflow import WorkflowVo
from src.api.workflow import repository


def create_workflow(workflow: WorkflowVo) -> dict:
    db_workflow = repository.create_workflow(workflow)

    return {
        "id": db_workflow.id,
        "workflow": json.loads(db_workflow.json)
    }