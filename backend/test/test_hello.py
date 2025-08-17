from src.dto.workflow_dto import WorkflowDto
from src.hello import Workflow, WorkflowModel


def test_linear_dag():
    items = {"1": WorkflowModel(name='a', uid='1'),
             "2": WorkflowModel(name='b', uid='2'),
             "3": WorkflowModel(name='c', uid='3')}
    graph = {"1": ["2"], "2": ["3"], "3": []}
    dto = WorkflowDto(items=items, graph=graph)

    workflows = Workflow.from_workflow_dto(dto)

    # Should return C as the root of reverse construction
    assert len(workflows) == 1
    c = workflows[0]
    assert c.name == "a"
    assert len(c._next) == 1
    assert c._next[0].name == "b"
    assert c._next[0]._next[0].name == "c"

def test_multiple_sinks():
    items = {
        "1": WorkflowModel(name='a', uid='1'),
        "2": WorkflowModel(name='b', uid='2'),
        "3": WorkflowModel(name='c', uid='3'),
        "4": WorkflowModel(name='d', uid='4')
    }
    graph = {
        "1": ["2", "3"],  # 1 points to 2 and 3
        "2": ["4"],       # 2 points to 4
        "3": [],          # 3 is a sink
        "4": []           # 4 is a sink
    }
    dto = WorkflowDto(items=items, graph=graph)
    workflows = Workflow.from_workflow_dto(dto)

    # There should be 2 sinks
    sink_names = sorted([w.name for w in workflows])
    assert sink_names == ["a"]


def test_diamond_dag():
    items = {
        "1": WorkflowModel(name='a', uid='1'),
        "2": WorkflowModel(name='b', uid='2'),
        "3": WorkflowModel(name='c', uid='3'),
        "4": WorkflowModel(name='d', uid='4')
    }
    graph = {
        "1": ["2", "3"],
        "2": ["4"],
        "3": ["4"],
        "4": []
    }
    dto = WorkflowDto(items=items, graph=graph)
    workflows = Workflow.from_workflow_dto(dto)

    # Source node is 'a'
    assert len(workflows) == 1
    a = workflows[0]
    next_names = sorted([n.name for n in a._next])
    assert next_names == ["b", "c"]
    # D should be reachable through B and C
    d_via_b = a._next[0]._next[0].name
    d_via_c = a._next[1]._next[0].name
    assert d_via_b == "d"
    assert d_via_c == "d"


if __name__ == "__main__":
    test_diamond_dag()
    print("Test passed!")