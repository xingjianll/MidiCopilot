import os
from pathlib import Path
from datetime import datetime

from symusic import Score
from symusic.core import TrackTick, TempoTick

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

        # Convert any file paths to MidiTrack objects before execution
        converted_inputs = _convert_inputs_for_workflow_modules(run_request.inputs, run_request.workflow)

        # Execute the workflow
        workflow_instance = Workflow(run_request.workflow)
        execution_result = workflow_instance.run(**converted_inputs)

    elif run_request.workflow_id is not None:
        # Use existing workflow and execute it
        workflow_id = run_request.workflow_id

        # Fetch workflow from database
        workflow_response = workflow_service.get_workflow(workflow_id)
        if workflow_response is None:
            raise ValueError(f"Workflow with ID {workflow_id} not found")

        # Convert any file paths to MidiTrack objects before execution
        converted_inputs = _convert_inputs_for_workflow_modules(run_request.inputs, workflow_response)

        # Execute the workflow
        workflow_instance = Workflow(workflow_response)
        execution_result = workflow_instance.run(**converted_inputs)

    elif run_request.module_name is not None:
        # Execute module directly (no workflow needed)
        module_class = _get_module_class(run_request.module_name)
        if not module_class:
            raise ValueError(f"Module '{run_request.module_name}' not found")

        # Convert any file paths to MidiTrack objects before execution
        converted_inputs = _convert_inputs_for_module(run_request.inputs, module_class)

        module_instance = module_class()
        execution_result = module_instance.run(**converted_inputs)
        workflow_id = None  # No workflow for direct module execution

    else:
        raise ValueError("One of workflow, workflow_id, or module_name must be provided")

    # Calculate execution duration
    end_time = datetime.utcnow()
    duration = (end_time - start_time).total_seconds()

    # Create the run record (with or without workflow_id)
    db_run = repository.create_run(workflow_id)

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


def _convert_inputs_for_module(inputs: dict, module_class) -> dict:
    """
    Convert file paths to appropriate types based on module signature.
    For MidiTrack inputs, convert file paths to TrackTick objects.
    """
    try:
        # Get module signature to understand expected input types
        params, _ = module_class.get_sig()
        converted_inputs = {}

        print(f"Module signature params: {params}")
        print(f"Input values: {inputs}")

        for param_name, param_type in params.items():
            if param_name in inputs:
                input_value = inputs[param_name]
                print(f"Processing {param_name}: {param_type} = {input_value}")

                # Check if this parameter expects a MidiTrack/TrackTick
                # Look for MidiTrack in the type name or check if it's TrackTick
                param_type_name = getattr(param_type, '__name__', str(param_type))
                print(f"Parameter type name: {param_type_name}")

                if param_type_name == 'MidiTrack' or param_type == TrackTick:
                    # Convert file path to TrackTick
                    if isinstance(input_value, str):
                        print(f"Converting path to TrackTick: {input_value}")
                        converted_inputs[param_name] = _load_midi_track_from_path(input_value)
                    else:
                        # Already a TrackTick object
                        converted_inputs[param_name] = input_value
                else:
                    # Keep other types as-is
                    converted_inputs[param_name] = input_value
            else:
                print(f"Parameter {param_name} not found in inputs")

        print(f"Converted inputs: {converted_inputs}")
        return converted_inputs

    except Exception as e:
        # If signature analysis fails, return inputs as-is
        print(f"Warning: Could not analyze module signature: {e}")
        import traceback
        traceback.print_exc()
        return inputs


def _convert_inputs_for_workflow_modules(inputs: dict, workflow_vo) -> dict:
    """
    Convert file paths to MidiTrack objects for workflow execution.
    """
    converted_inputs = inputs.copy()

    # Find all edges going out of InputNodes
    for edge in workflow_vo.edges:
        source_node = next((n for n in workflow_vo.nodes if n.uid == edge.from_uid), None)
        target_node = next((n for n in workflow_vo.nodes if n.uid == edge.to_uid), None)

        if (source_node and source_node.type_ == "InputNode" and
            target_node and target_node.type_ not in ["InputNode", "OutputNode"]):

            # Check if this edge's from_parameter matches an input field
            if edge.from_parameter in inputs:
                # Get target module class to check if it expects MidiTrack
                module_class = _get_module_class(target_node.type_)
                if module_class:
                    try:
                        params, _ = module_class.get_sig()
                        param_type = params.get(edge.to_parameter)
                        param_type_name = getattr(param_type, '__name__', str(param_type))

                        if param_type_name == 'MidiTrack' or param_type == TrackTick:
                            input_value = inputs[edge.from_parameter]
                            if isinstance(input_value, str):
                                converted_inputs[edge.from_parameter] = _load_midi_track_from_path(input_value)
                    except Exception as e:
                        print(f"Warning: Could not check parameter type: {e}")

    return converted_inputs


def _load_midi_track_from_path(file_path: str):
    """
    Load a MIDI file from the given path and return a MidiTrack with track and tempo info.
    """
    print(f"Loading MIDI file from path: {file_path}")

    if not os.path.exists(file_path):
        raise FileNotFoundError(f"MIDI file not found: {file_path}")

    try:
        # Load MIDI file using symusic
        score = Score.from_file(file_path)
        score.ticks_per_quarter
        score.dump_midi("./test0.mid")
        print(f"Loaded score with {len(score.tracks)} tracks")

        if not score.tracks:
            raise ValueError(f"No tracks found in MIDI file: {file_path}")

        # Import MidiTrack here to avoid circular imports
        from src.core.modules.aria_base import MidiTrack

        # Get the first track and timing information
        track = score.tracks[0]
        tempos = score.tempos if score.tempos else None
        ticks_per_quarter = score.ticks_per_quarter

        # Create and return MidiTrack
        midi_track = MidiTrack(track=track, tempos=tempos, ticks_per_quarter=ticks_per_quarter)
        print(f"Returning MidiTrack with track type: {type(track)}, {len(tempos) if tempos else 0} tempo changes, and {ticks_per_quarter} ticks per quarter")
        return midi_track

    except Exception as e:
        print(f"Error loading MIDI file: {e}")
        import traceback
        traceback.print_exc()
        raise ValueError(f"Failed to load MIDI file {file_path}: {str(e)}")


def _handle_midi_track_result(result_dict: dict) -> int | None:
    """
    Check if result contains MidiTrack, save to file, and create sample.
    Returns sample_id if MidiTrack found, None otherwise.
    """
    midi_track = None

    # Import MidiTrack here to avoid circular imports
    from src.core.modules.aria_base import MidiTrack

    # Look for MidiTrack in the result dictionary
    for key, value in result_dict.items():
        if isinstance(value, MidiTrack):
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
    score.tracks.append(midi_track.track)
    if midi_track.tempos:
        score.tempos = midi_track.tempos
    if midi_track.ticks_per_quarter:
        score.ticks_per_quarter = midi_track.ticks_per_quarter
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