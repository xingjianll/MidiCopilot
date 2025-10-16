from fastapi import APIRouter, HTTPException, Query, UploadFile, File

from src.api.sample import service
from src.api.sample.dto.sample_dto import SampleCreateRequest, Response, DeleteResponse

router = APIRouter(
    prefix="/sample",
    tags=["sample"],
)


@router.post("/")
def create_sample(sample_request: SampleCreateRequest) -> Response:
    return service.create_sample(sample_request)


@router.post("/upload/")
def upload_sample(file: UploadFile = File(...)) -> Response:
    return service.upload_sample(file)


@router.get("/{sample_id}")
def get_sample(sample_id: int) -> Response:
    sample = service.get_sample(sample_id)
    if sample is None:
        raise HTTPException(status_code=404, detail="Sample not found")
    return sample


@router.get("/")
def get_samples(skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=1000)) -> list[Response]:
    return service.get_samples(skip=skip, limit=limit)


@router.put("/{sample_id}")
def update_sample(sample_id: int, sample_request: SampleCreateRequest) -> Response:
    updated_sample = service.update_sample(sample_id, sample_request)
    if updated_sample is None:
        raise HTTPException(status_code=404, detail="Sample not found")
    return updated_sample


@router.delete("/{sample_id}")
def delete_sample(sample_id: int) -> DeleteResponse:
    deleted = service.delete_sample(sample_id)
    if deleted is None:
        raise HTTPException(status_code=404, detail="Sample not found")
    return deleted