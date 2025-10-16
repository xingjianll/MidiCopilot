from datetime import datetime
from pydantic import BaseModel

from src.core.workflow import WorkflowVo


class RunCreateRequest(BaseModel):
    workflow: WorkflowVo


class Response(BaseModel):
    id: int
    workflow_id: int
    created_at: datetime
    duration: float | None


class DeleteResponse(BaseModel):
    message: str