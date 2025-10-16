from datetime import datetime
from typing import Any
from pydantic import BaseModel

from src.core.workflow import WorkflowVo


class RunCreateRequest(BaseModel):
    workflow: WorkflowVo | None = None
    workflow_id: int | None = None
    module_name: str | None = None
    inputs: dict[str, Any] = {}


class Response(BaseModel):
    id: int
    workflow_id: int | None
    created_at: datetime
    duration: float | None
    sample_id: int | None = None


class DeleteResponse(BaseModel):
    message: str