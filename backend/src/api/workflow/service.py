import json

from src.core.workflow import WorkflowVo
from src.api.workflow import repository
from src.api.workflow.dto.workflow_dto import Response, DeleteResponse


def create_workflow(workflow: WorkflowVo) -> Response:
    db_workflow = repository.create_workflow(workflow)

    return Response(
        id=db_workflow.id,
        workflow=WorkflowVo.model_validate(json.loads(db_workflow.json))
    )


def get_workflow(workflow_id: int) -> WorkflowVo | None:
    db_workflow = repository.get_workflow(workflow_id)
    if db_workflow is None:
        return None

    return WorkflowVo.model_validate(json.loads(db_workflow.json))


def get_workflows(skip: int = 0, limit: int = 100) -> list[Response]:
    db_workflows = repository.get_workflows(skip=skip, limit=limit)

    return [
        Response(
            id=db_workflow.id,
            workflow=WorkflowVo.model_validate(json.loads(db_workflow.json))
        )
        for db_workflow in db_workflows
    ]


def update_workflow(workflow_id: int, workflow: WorkflowVo) -> Response | None:
    db_workflow = repository.update_workflow(workflow_id, workflow)
    if db_workflow is None:
        return None

    return Response(
        id=db_workflow.id,
        workflow=WorkflowVo.model_validate(json.loads(db_workflow.json))
    )


def delete_workflow(workflow_id: int) -> DeleteResponse | None:
    deleted = repository.delete_workflow(workflow_id)
    if not deleted:
        return None

    return DeleteResponse(message="Workflow deleted successfully")