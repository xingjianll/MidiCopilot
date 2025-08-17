from pydantic import BaseModel


class WorkflowDto(BaseModel):
    graph: dict[str, list[str]]
    items: dict[str, BaseModel]
    ...