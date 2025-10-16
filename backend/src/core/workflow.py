from typing import Any

from pydantic import BaseModel

from core.runnable import Runnable


class Node(BaseModel):
    uid: str
    type_: str
    x: float
    y: float


class Edge(BaseModel):
    from_uid: str
    from_parameter: str
    to_uid: str
    to_parameter: str

class WorkflowVo(BaseModel):
    edges: list[Edge]
    nodes: list[Node]


class Workflow(Runnable[Any, dict]):
    workflow: WorkflowVo

    def __init__(self, graph: str):
        ...

    def run(self, *args: Any, **kwargs: Any) -> dict:
        ...


