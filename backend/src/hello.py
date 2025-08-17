from typing import List, Self
from pydantic import BaseModel

from src.dto.workflow_dto import WorkflowDto


class Workflow:
    _next: List[Self]
    _dto: BaseModel
    _uid: str
    _name: str

    def __init__(self, dto: BaseModel, next: List[Self] = None):
        self._dto = dto
        self._next = next if next is not None else []

    @classmethod
    def from_workflow_dto(cls, dto: WorkflowDto) -> List[Self]:
        """
        Factory method to create a Workflow instance from a WorkflowDto.
        """
        visited = {}
        frontier = [Workflow(dto.items[node], None) for node, next in dto.graph.items() if not next]
        rt = []
        while frontier:
            current = frontier.pop(0)
            pred = [node for node, next in dto.graph.items() if current.id in next]
            if not pred:
                rt.append(current)
                continue

            for node in pred:
                if node not in visited:
                    w = Workflow(dto.items[node], [current])
                    visited[node] = w
                    frontier.append(w)
                else:
                    visited[node]._next.append(current)
        return rt

    @property
    def id(self) -> str:
        return self._uid

    @property
    def name(self) -> str:
        return self._name

    @property
    def next(self) -> List[Self]:
        """
        Returns the next nodes in the workflow.
        """
        return self._next

    def run(self):
        ...

    def to_workflow_dto(self) -> WorkflowDto:
        """
        Converts the Workflow instance back into a WorkflowDto.
        Traverses the DAG and reconstructs the items and graph dictionaries.
        """
        items = {}
        graph = {}

        visited = set()
        frontier = [self]

        while frontier:
            current = frontier.pop(0)
            if current.id in visited:
                continue
            visited.add(current.id)

            items[current.id] = current
            graph[current.id] = [n.id for n in current.next]
            frontier.extend(current.next)

        return WorkflowDto(items=items, graph=graph)


