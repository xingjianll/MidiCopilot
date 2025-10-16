from pydantic import BaseModel

from backend.src.core.graph import Graph


class WorkflowDto[T](Graph[T]):
    graph: dict[str, list[str]]
    items: dict[str, BaseModel]
    ...