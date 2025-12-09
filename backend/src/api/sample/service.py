import os
import time
import mido
from pathlib import Path
from fastapi import UploadFile, HTTPException

from src.api.sample import repository
from src.api.sample.dto.sample_dto import SampleCreateRequest, Response, DeleteRequest, DeleteResponse, SamplePlayRequest, PlayResponse, RenameRequest
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


def delete_sample(sample_id: int, delete_request: DeleteRequest) -> DeleteResponse | None:
    # Get the sample first to get the file path
    db_sample = repository.get_sample(sample_id)
    if db_sample is None:
        return None
    
    file_path = db_sample.path
    
    # Delete from database
    deleted = repository.delete_sample(sample_id)
    if not deleted:
        return None
    
    # Delete file from disk if requested
    file_deleted = False
    if delete_request.delete_file and os.path.exists(file_path):
        try:
            os.remove(file_path)
            file_deleted = True
        except Exception as e:
            # Log error but don't fail the entire operation
            print(f"Warning: Failed to delete file {file_path}: {e}")

    return DeleteResponse(
        message="Sample deleted successfully",
        file_deleted=file_deleted
    )


def upload_sample(file: UploadFile) -> Response:
    # Create MidiCopilot directory in Documents
    documents_path = Path.home() / "Documents" / "MidiCopilot"
    documents_path.mkdir(parents=True, exist_ok=True)

    # Save the uploaded file
    file_path = documents_path / file.filename
    
    # Check if file already exists
    if file_path.exists():
        # Check if this file path is already in the database
        existing_sample = repository.get_sample_by_path(str(file_path))
        if existing_sample:
            raise HTTPException(
                status_code=409,
                detail=f"A sample with this file already exists (ID: {existing_sample.id}). Delete the existing sample first or rename the file."
            )

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


def rename_sample(sample_id: int, rename_request: RenameRequest) -> Response | None:
    """Rename a sample file and update the database"""
    # Get the sample from database
    db_sample = repository.get_sample(sample_id)
    if db_sample is None:
        return None
    
    # Get current file path and directory
    current_path = Path(db_sample.path)
    if not current_path.exists():
        raise HTTPException(status_code=404, detail="Sample file not found on disk")
    
    # Create new path with the new name
    new_name = rename_request.new_name
    # Preserve the file extension
    file_extension = current_path.suffix
    if not new_name.endswith(file_extension):
        new_name = new_name + file_extension
    
    new_path = current_path.parent / new_name
    
    # Check if new path already exists
    if new_path.exists():
        raise HTTPException(status_code=409, detail="A file with this name already exists")
    
    # Check if this path is already in use by another sample
    existing_sample = repository.get_sample_by_path(str(new_path))
    if existing_sample and existing_sample.id != sample_id:
        raise HTTPException(
            status_code=409,
            detail=f"Another sample (ID: {existing_sample.id}) already uses this file path"
        )
    
    try:
        # Rename the file
        current_path.rename(new_path)
        
        # Update database
        update_request = SampleCreateRequest(
            type=db_sample.type,
            path=str(new_path)
        )
        return update_sample(sample_id, update_request)
        
    except Exception as e:
        # If rename fails, try to restore original state
        if new_path.exists() and not current_path.exists():
            try:
                new_path.rename(current_path)
            except:
                pass
        raise HTTPException(status_code=500, detail=f"Failed to rename file: {str(e)}")