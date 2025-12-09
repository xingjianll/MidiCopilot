from typing import Any
from collections import defaultdict, deque

from pydantic import BaseModel

from src.core.runnable import Runnable
from src.core.module import Module


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
    name: str
    description: str
    edges: list[Edge]
    nodes: list[Node]


class Workflow(Runnable[Any, dict]):
    workflow: WorkflowVo

    def __init__(self, workflow: WorkflowVo):
        self.workflow = workflow
        self.nodes_by_uid = {node.uid: node for node in workflow.nodes}
        self.module_instances = {}

        # Initialize module instances (except for special nodes)
        for node in workflow.nodes:
            if node.type_ not in ["InputNode", "OutputNode"]:
                # Get the module class from registered subclasses
                module_class = self._get_module_class(node.type_)
                if module_class:
                    self.module_instances[node.uid] = module_class()

    def _get_module_class(self, type_name: str):
        """Get module class by name from registered subclasses."""
        for module_vo in Module.registered_subclasses():
            if module_vo.name == type_name:
                # Find the actual class by name
                for subclass in Module.__subclasses__():
                    if subclass.__name__ == type_name:
                        return subclass
        return None

    def _topological_sort(self) -> list[str]:
        """Return nodes in topological order for execution."""
        # Build adjacency list
        graph = defaultdict(list)
        in_degree = defaultdict(int)

        # Initialize all nodes
        for node in self.workflow.nodes:
            in_degree[node.uid] = 0

        # Build graph from edges
        for edge in self.workflow.edges:
            graph[edge.from_uid].append(edge.to_uid)
            in_degree[edge.to_uid] += 1

        # Topological sort using Kahn's algorithm
        queue = deque([uid for uid, degree in in_degree.items() if degree == 0])
        result = []

        while queue:
            current = queue.popleft()
            result.append(current)

            for neighbor in graph[current]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        if len(result) != len(self.workflow.nodes):
            raise ValueError("Workflow contains cycles")

        return result

    async def run(self, *args: Any, **kwargs: Any) -> dict:
        """Execute the workflow DAG."""
        # Get execution order
        execution_order = self._topological_sort()

        # Store results for each node
        node_results = {}

        # Build edge mappings for easier lookup
        outgoing_edges = defaultdict(list)  # from_uid -> [edges]
        incoming_edges = defaultdict(list)  # to_uid -> [edges]

        for edge in self.workflow.edges:
            outgoing_edges[edge.from_uid].append(edge)
            incoming_edges[edge.to_uid].append(edge)

        # Execute nodes in topological order
        for node_uid in execution_order:
            node = self.nodes_by_uid[node_uid]

            if node.type_ == "InputNode":
                # InputNode: pass through input arguments
                # Find the outgoing edge to get the parameter name
                edges = outgoing_edges[node_uid]
                if len(edges) != 1:
                    raise ValueError(f"InputNode {node_uid} must have exactly one outgoing edge")

                edge = edges[0]
                param_name = edge.from_parameter

                # Get the input value from kwargs
                if param_name in kwargs:
                    node_results[node_uid] = {param_name: kwargs[param_name]}
                else:
                    raise ValueError(f"Required input parameter '{param_name}' not provided")

            elif node.type_ == "OutputNode":
                # OutputNode: collect from incoming edges
                edges = incoming_edges[node_uid]
                if len(edges) != 1:
                    raise ValueError(f"OutputNode {node_uid} must have exactly one incoming edge")

                # Will be handled when building final result
                node_results[node_uid] = {}

            else:
                # Regular module node: collect inputs and execute
                module_instance = self.module_instances.get(node_uid)
                if not module_instance:
                    raise ValueError(f"No module instance found for node {node_uid}")

                # Collect inputs from incoming edges
                module_inputs = {}
                for edge in incoming_edges[node_uid]:
                    source_result = node_results[edge.from_uid]

                    # Get the value from the source node's result
                    if edge.from_parameter in source_result:
                        module_inputs[edge.to_parameter] = source_result[edge.from_parameter]
                    else:
                        raise ValueError(f"Parameter '{edge.from_parameter}' not found in result from node {edge.from_uid}")

                # Execute the module
                result = await module_instance.run(**module_inputs)
                node_results[node_uid] = result

        # Build final output dictionary from OutputNodes
        output_dict = {}
        for node in self.workflow.nodes:
            if node.type_ == "OutputNode":
                edges = incoming_edges[node.uid]
                if len(edges) == 1:
                    edge = edges[0]
                    source_result = node_results[edge.from_uid]

                    if edge.from_parameter in source_result:
                        output_dict[edge.to_parameter] = source_result[edge.from_parameter]
                    else:
                        raise ValueError(f"Parameter '{edge.from_parameter}' not found in result from node {edge.from_uid}")

        return output_dict


