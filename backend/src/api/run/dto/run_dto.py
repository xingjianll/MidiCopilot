from datetime import datetime
from pydantic import BaseModel

from src.core.workflow import WorkflowVo


class RunCreateRequest(BaseModel):
    workflow: WorkflowVo | None = None
    workflow_id: int | None = None
    module_name: str | None = None


class Response(BaseModel):
    id: int
    workflow_id: int
    created_at: datetime
    duration: float | None


class DeleteResponse(BaseModel):
    message: str