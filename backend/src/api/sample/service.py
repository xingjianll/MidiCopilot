import os
import time
import mido
from pathlib import Path
from fastapi import UploadFile, HTTPException

from src.api.sample import repository
from src.api.sample.dto.sample_dto import SampleCreateRequest, Response, DeleteResponse, SamplePlayRequest, PlayResponse
from src.api.sample.table.sample import SampleType


def create_sample(sample_request: SampleCreateRequest) -> Response:
    db_sample = repository.create_sample(sample_request)

    return Response(
        id=db_sample.id,
        type=db_sample.type,
        path=db_sample.path
    )


def get_sample(sample_id: int) -> Response | None:
    db_sample = repository.get_sample(sample_id)
    if db_sample is None:
        return None

    return Response(
        id=db_sample.id,
        type=db_sample.type,
        path=db_sample.path
    )


def get_samples(skip: int = 0, limit: int = 100) -> list[Response]:
    db_samples = repository.get_samples(skip=skip, limit=limit)

    return [
        Response(
            id=db_sample.id,
            type=db_sample.type,
            path=db_sample.path
        )
        for db_sample in db_samples
    ]


def update_sample(sample_id: int, sample_request: SampleCreateRequest) -> Response | None:
    db_sample = repository.update_sample(sample_id, sample_request)
    if db_sample is None:
        return None

    return Response(
        id=db_sample.id,
        type=db_sample.type,
        path=db_sample.path
    )


def delete_sample(sample_id: int) -> DeleteResponse | None:
    deleted = repository.delete_sample(sample_id)
    if not deleted:
        return None

    return DeleteResponse(message="Sample deleted successfully")


def upload_sample(file: UploadFile) -> Response:
    # Create MidiCopilot directory in Documents
    documents_path = Path.home() / "Documents" / "MidiCopilot"
    documents_path.mkdir(parents=True, exist_ok=True)

    # Save the uploaded file
    file_path = documents_path / file.filename

    # Write file content
    with open(file_path, "wb") as f:
        content = file.file.read()
        f.write(content)

    # Determine sample type based on file extension
    file_extension = Path(file.filename).suffix.lower()
    if file_extension in ['.mid', '.midi']:
        sample_type = SampleType.MIDI
    elif file_extension in ['.wav', '.mp3', '.flac', '.ogg']:
        sample_type = SampleType.AUDIO
    else:
        sample_type = SampleType.MIDI  # Default to MIDI

    # Create sample record
    sample_request = SampleCreateRequest(
        type=sample_type,
        path=str(file_path)
    )

    return create_sample(sample_request)


def play_sample(sample_id: int, play_request: SamplePlayRequest) -> PlayResponse:
    """Play a MIDI sample through the specified output port"""
    # Get the sample from database
    db_sample = repository.get_sample(sample_id)
    if db_sample is None:
        raise HTTPException(status_code=404, detail="Sample not found")
    
    # Only play MIDI files
    if db_sample.type != SampleType.MIDI:
        raise HTTPException(status_code=400, detail="Can only play MIDI files")
    
    # Check if file exists
    if not os.path.exists(db_sample.path):
        raise HTTPException(status_code=404, detail="Sample file not found")
    
    try:
        # Load the MIDI file
        midi_file = mido.MidiFile(db_sample.path)
        
        # Open the output port
        with mido.open_output(play_request.port) as port:
            # Play all messages in the MIDI file
            for message in midi_file.play():
                port.send(message)
        
        return PlayResponse(message=f"Successfully played MIDI file through port '{play_request.port}'")
    
    except OSError as e:
        if "cannot open port" in str(e).lower():
            raise HTTPException(status_code=400, detail=f"Cannot open MIDI port '{play_request.port}'. Port may not exist or be in use.")
        else:
            raise HTTPException(status_code=500, detail=f"Error opening MIDI file: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error playing MIDI file: {str(e)}")