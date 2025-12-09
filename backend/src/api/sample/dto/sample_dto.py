from pydantic import BaseModel

from src.api.sample.table.sample import SampleType


class SampleCreateRequest(BaseModel):
    type: SampleType
    path: str


class SamplePlayRequest(BaseModel):
    port: str  # MIDI output port name


class Response(BaseModel):
    id: int
    type: SampleType
    path: str


class DeleteRequest(BaseModel):
    delete_file: bool = False


class DeleteResponse(BaseModel):
    message: str
    file_deleted: bool = False


class PlayResponse(BaseModel):
    message: str


class RenameRequest(BaseModel):
    new_name: str