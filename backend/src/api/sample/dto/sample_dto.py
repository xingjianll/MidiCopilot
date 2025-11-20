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


class DeleteResponse(BaseModel):
    message: str


class PlayResponse(BaseModel):
    message: str