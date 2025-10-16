import os
from pathlib import Path
from fastapi import UploadFile

from src.api.sample import repository
from src.api.sample.dto.sample_dto import SampleCreateRequest, Response, DeleteResponse
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