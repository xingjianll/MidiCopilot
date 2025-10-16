from fastapi import APIRouter

from src.core.workflow import WorkflowVo
from src.api.workflow import service

router = APIRouter(
    prefix="/workflow",
    tags=["workflow"],
)


@router.post("/")
def create_workflow(workflow: WorkflowVo):
    return service.create_workflow(workflow)