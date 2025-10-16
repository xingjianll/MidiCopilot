from pydantic import BaseModel

from src.core.workflow import WorkflowVo


class Response(BaseModel):
    id: int
    workflow: WorkflowVo


class ListResponse(BaseModel):
    workflows: list[Response]


class DeleteResponse(BaseModel):
    message: str