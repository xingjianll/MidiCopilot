from pydantic import BaseModel


class Graph[T](BaseModel):
    edges: dict[str, list[str]]
    nodes: dict[str, T]