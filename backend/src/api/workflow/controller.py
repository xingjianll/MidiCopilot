from fastapi import APIRouter

from core.workflow import WorkflowVo

router = APIRouter(
    prefix="/workflow",
    tags=["workflow"],
)


@router.post("/")
def create_workflow(workflow: WorkflowVo):
    rt = service.create_workflow(workflow)
    return ...