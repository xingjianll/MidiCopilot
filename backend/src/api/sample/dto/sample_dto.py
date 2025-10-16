from pydantic import BaseModel

from src.api.sample.table.sample import SampleType


class SampleCreateRequest(BaseModel):
    type: SampleType
    path: str


class Response(BaseModel):
    id: int
    type: SampleType
    path: str


class DeleteResponse(BaseModel):
    message: str