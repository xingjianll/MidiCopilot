from src.api.run import repository
from src.api.workflow import service as workflow_service
from src.api.run.dto.run_dto import RunCreateRequest, Response, DeleteResponse


def create_run(run_request: RunCreateRequest) -> Response:
    workflow_id: int

    if run_request.workflow is not None:
        # Create the workflow first
        workflow_response = workflow_service.create_workflow(run_request.workflow)
        workflow_id = workflow_response.id
    elif run_request.workflow_id is not None:
        # Use existing workflow ID
        workflow_id = run_request.workflow_id
    elif run_request.module_name is not None:
        # For module_name, we'll need to handle this case
        # For now, let's raise an error as module handling might need additional logic
        raise ValueError("Module name handling not yet implemented")
    else:
        raise ValueError("One of workflow, workflow_id, or module_name must be provided")

    # Create the run with the workflow ID
    db_run = repository.create_run(workflow_id)

    return Response(
        id=db_run.id,
        workflow_id=db_run.workflow_id,
        created_at=db_run.created_at,
        duration=db_run.duration
    )


def get_run(run_id: int) -> Response | None:
    db_run = repository.get_run(run_id)
    if db_run is None:
        return None

    return Response(
        id=db_run.id,
        workflow_id=db_run.workflow_id,
        created_at=db_run.created_at,
        duration=db_run.duration
    )


def get_runs(skip: int = 0, limit: int = 100) -> list[Response]:
    db_runs = repository.get_runs(skip=skip, limit=limit)

    return [
        Response(
            id=db_run.id,
            workflow_id=db_run.workflow_id,
            created_at=db_run.created_at,
            duration=db_run.duration
        )
        for db_run in db_runs
    ]


def update_run_duration(run_id: int, duration: float) -> Response | None:
    db_run = repository.update_run_duration(run_id, duration)
    if db_run is None:
        return None

    return Response(
        id=db_run.id,
        workflow_id=db_run.workflow_id,
        created_at=db_run.created_at,
        duration=db_run.duration
    )


def delete_run(run_id: int) -> DeleteResponse | None:
    deleted = repository.delete_run(run_id)
    if not deleted:
        return None

    return DeleteResponse(message="Run deleted successfully")