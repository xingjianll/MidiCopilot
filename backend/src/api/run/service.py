import os
from pathlib import Path
from datetime import datetime

from symusic import Score
from symusic.core import TrackTick

from src.api.run import repository
from src.api.workflow import service as workflow_service
from src.api.sample import service as sample_service
from src.api.run.dto.run_dto import RunCreateRequest, Response, DeleteResponse
from src.api.sample.dto.sample_dto import SampleCreateRequest
from src.api.sample.table.sample import SampleType
from src.core.module import Module
from src.core.workflow import Workflow


def create_run(run_request: RunCreateRequest) -> Response:
    start_time = datetime.utcnow()
    workflow_id: int | None = None
    execution_result: dict = {}

    if run_request.workflow is not None:
        # Create and execute workflow
        workflow_response = workflow_service.create_workflow(run_request.workflow)
        workflow_id = workflow_response.id

        # Execute the workflow
        workflow_instance = Workflow(run_request.workflow)
        execution_result = workflow_instance.run(**run_request.inputs)

    elif run_request.workflow_id is not None:
        # Use existing workflow and execute it
        workflow_id = run_request.workflow_id

        # Fetch workflow from database
        workflow_response = workflow_service.get_workflow(workflow_id)
        if workflow_response is None:
            raise ValueError(f"Workflow with ID {workflow_id} not found")

        # Execute the workflow
        workflow_instance = Workflow(workflow_response)
        execution_result = workflow_instance.run(**run_request.inputs)

    elif run_request.module_name is not None:
        # Execute module directly (no workflow needed)
        module_class = _get_module_class(run_request.module_name)
        if not module_class:
            raise ValueError(f"Module '{run_request.module_name}' not found")

        module_instance = module_class()
        execution_result = module_instance.run(**run_request.inputs)
        workflow_id = None  # No workflow for direct module execution

    else:
        raise ValueError("One of workflow, workflow_id, or module_name must be provided")

    # Calculate execution duration
    end_time = datetime.utcnow()
    duration = (end_time - start_time).total_seconds()

    # Create the run record (with or without workflow_id)
    if workflow_id is not None:
        db_run = repository.create_run(workflow_id)
    else:
        # For module execution, we need to create a temporary workflow or handle differently
        # For now, let's create a simple workflow record
        from src.core.workflow import WorkflowVo
        temp_workflow = WorkflowVo(
            name=f"Module_{run_request.module_name}",
            description=f"Temporary workflow for module {run_request.module_name} execution",
            edges=[],
            nodes=[]
        )
        workflow_response = workflow_service.create_workflow(temp_workflow)
        db_run = repository.create_run(workflow_response.id)

    # Update duration
    repository.update_run_duration(db_run.id, duration)

    # Handle MidiTrack results and create samples
    sample_id = _handle_midi_track_result(execution_result)

    return Response(
        id=db_run.id,
        workflow_id=db_run.workflow_id,
        created_at=db_run.created_at,
        duration=duration,
        sample_id=sample_id
    )


def _get_module_class(module_name: str):
    """Get module class by name from registered subclasses."""
    for module_vo in Module.registered_subclasses():
        if module_vo.name == module_name:
            # Find the actual class by name
            for subclass in Module.__subclasses__():
                if subclass.__name__ == module_name:
                    return subclass
    return None


def _handle_midi_track_result(result_dict: dict) -> int | None:
    """
    Check if result contains MidiTrack, save to file, and create sample.
    Returns sample_id if MidiTrack found, None otherwise.
    """
    midi_track = None

    # Look for MidiTrack in the result dictionary
    for key, value in result_dict.items():
        if isinstance(value, TrackTick):
            midi_track = value
            break

    if midi_track is None:
        return None

    # Create MidiCopilot directory in Documents
    documents_path = Path.home() / "Documents" / "MidiCopilot"
    documents_path.mkdir(parents=True, exist_ok=True)

    # Generate unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"generated_{timestamp}.mid"
    file_path = documents_path / filename

    # Save MidiTrack to file
    score = Score()
    score.tracks.append(midi_track)
    score.dump_midi(str(file_path))

    # Create sample record
    sample_request = SampleCreateRequest(
        type=SampleType.MIDI,
        path=str(file_path)
    )

    sample_response = sample_service.create_sample(sample_request)
    return sample_response.id


def get_run(run_id: int) -> Response | None:
    db_run = repository.get_run(run_id)
    if db_run is None:
        return None

    return Response(
        id=db_run.id,
        workflow_id=db_run.workflow_id,
        created_at=db_run.created_at,
        duration=db_run.duration,
        sample_id=None  # TODO: Store sample_id in database or retrieve from run metadata
    )


def get_runs(skip: int = 0, limit: int = 100) -> list[Response]:
    db_runs = repository.get_runs(skip=skip, limit=limit)

    return [
        Response(
            id=db_run.id,
            workflow_id=db_run.workflow_id,
            created_at=db_run.created_at,
            duration=db_run.duration,
            sample_id=None  # TODO: Store sample_id in database or retrieve from run metadata
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
        duration=db_run.duration,
        sample_id=None  # TODO: Store sample_id in database or retrieve from run metadata
    )


def delete_run(run_id: int) -> DeleteResponse | None:
    deleted = repository.delete_run(run_id)
    if not deleted:
        return None

    return DeleteResponse(message="Run deleted successfully")