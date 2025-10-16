from fastapi import APIRouter, HTTPException, Query

from src.core.workflow import WorkflowVo
from src.api.workflow import service
from src.api.workflow.dto.workflow_dto import Response, DeleteResponse

router = APIRouter(
    prefix="/workflow",
    tags=["workflow"],
)


@router.post("/")
def create_workflow(workflow: WorkflowVo) -> Response:
    return service.create_workflow(workflow)


@router.get("/{workflow_id}")
def get_workflow(workflow_id: int) -> WorkflowVo:
    workflow = service.get_workflow(workflow_id)
    if workflow is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow


@router.get("/")
def get_workflows(skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=1000)) -> list[Response]:
    return service.get_workflows(skip=skip, limit=limit)


@router.put("/{workflow_id}")
def update_workflow(workflow_id: int, workflow: WorkflowVo) -> Response:
    updated_workflow = service.update_workflow(workflow_id, workflow)
    if updated_workflow is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return updated_workflow


@router.delete("/{workflow_id}")
def delete_workflow(workflow_id: int) -> DeleteResponse:
    deleted = service.delete_workflow(workflow_id)
    if deleted is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return deleted