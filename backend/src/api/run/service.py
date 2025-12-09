import inspect
import os
from pathlib import Path
from datetime import datetime
from typing import Type, Optional

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
from src.core.modules.midi_seq2seq import ProgressCallback, MidiSeq2SeqMixin
from src.utils import stringify
from src.queue_manager import get_run_queue


async def create_run(run_request: RunCreateRequest) -> Response:
    """Create a run and add it to the queue for async processing"""
    workflow_id: int | None = None
    
    # Determine workflow_id if needed
    if run_request.workflow is not None:
        # Create workflow but don't execute yet
        workflow_response = workflow_service.create_workflow(run_request.workflow)
        workflow_id = workflow_response.id
    elif run_request.workflow_id is not None:
        workflow_id = run_request.workflow_id
        # Validate workflow exists
        workflow_response = workflow_service.get_workflow(workflow_id)
        if workflow_response is None:
            raise ValueError(f"Workflow with ID {workflow_id} not found")
    elif run_request.module_name is not None:
        # Validate module exists
        module_class = _get_module_class(run_request.module_name)
        if not module_class:
            raise ValueError(f"Module '{run_request.module_name}' not found")
        workflow_id = None
    else:
        raise ValueError("One of workflow, workflow_id, or module_name must be provided")

    # Create the run record immediately
    db_run = repository.create_run(workflow_id)
    
    # Add to queue for async processing
    queue = get_run_queue()
    await queue.add_run(
        run_id=db_run.id,
        workflow_id=workflow_id,
        module_name=run_request.module_name,
        inputs=run_request.inputs
    )

    return Response(
        id=db_run.id,
        workflow_id=db_run.workflow_id,
        created_at=db_run.created_at,
        duration=None,  # Will be updated when processing completes
        sample_id=None  # Will be updated when processing completes
    )


async def execute_run_internal(run_id: int, workflow_id: Optional[int], module_name: Optional[str], inputs: dict, websocket_manager=None) -> dict:
    """Internal function to execute a run (called by queue processor)"""
    start_time = datetime.utcnow()
    execution_result: dict = {}

    if workflow_id is not None:
        # Fetch workflow from database
        workflow_response = workflow_service.get_workflow(workflow_id)
        if workflow_response is None:
            raise ValueError(f"Workflow with ID {workflow_id} not found")

        # Convert any file paths to MidiTrack objects before execution
        converted_inputs = _convert_inputs_for_workflow_modules(inputs, workflow_response)

        # Execute the workflow
        workflow_instance = Workflow(workflow_response)
        execution_result = await workflow_instance.run(**converted_inputs)

    elif module_name is not None:
        # Execute module directly
        module_class = _get_module_class(module_name)
        if not module_class:
            raise ValueError(f"Module '{module_name}' not found")

        # Convert any file paths to MidiTrack objects before execution
        converted_inputs = _convert_inputs_for_module(inputs, module_class)

        module_instance = module_class()
        
        # Set up progress tracking if module supports it
        if isinstance(module_instance, MidiSeq2SeqMixin) and websocket_manager:
            progress_callback = ProgressCallback(run_id, websocket_manager)
            module_instance.set_progress_callback(progress_callback)
        
        execution_result = await module_instance.run(**converted_inputs)

    else:
        raise ValueError("Either workflow_id or module_name must be provided")

    # Calculate execution duration
    end_time = datetime.utcnow()
    duration = (end_time - start_time).total_seconds()

    # Update duration in database
    repository.update_run_duration(run_id, duration)

    # Handle MidiTrack results and create samples
    sample_id = _handle_midi_track_result(execution_result)
    
    return {
        'sample_id': sample_id,
        'duration': duration
    }


def _get_module_class(module_name: str):
    """Get module class by name from registered subclasses."""

    def walk(subclass: Type["Module"], module_name: str) -> Optional[Type["Module"]]:
        if not inspect.isabstract(subclass):
            if subclass.__name__ == module_name:
                return subclass

        for child in subclass.__subclasses__():
            m = walk(child, module_name)
            if m is not None:
                return m
        return None

    return walk(Module, module_name)


def _convert_inputs_for_module(inputs: dict, module_class: type[Module]) -> dict:
    """
    Convert file paths to appropriate types based on module signature.
    For MidiTrack inputs, convert file paths to TrackTick objects.
    """
    params, _ = module_class.get_sig()
    for param_name, param_type in stringify(params).items():
        if param_name in inputs:
            input_value = inputs[param_name]
            # Check if this parameter expects a MidiTrack/TrackTick
            # Look for MidiTrack in the type name or check if it's TrackTick
            if "MidiTrack" in param_type:
                if isinstance(input_value, str):
                    inputs[param_name] = _load_midi_track_from_path(input_value)
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