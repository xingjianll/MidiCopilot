from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from fastapi.responses import FileResponse

from src.api.sample import service
from src.api.sample.dto.sample_dto import SampleCreateRequest, Response, DeleteRequest, DeleteResponse, SamplePlayRequest, PlayResponse, RenameRequest

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
def delete_sample(sample_id: int, delete_request: DeleteRequest) -> DeleteResponse:
    deleted = service.delete_sample(sample_id, delete_request)
    if deleted is None:
        raise HTTPException(status_code=404, detail="Sample not found")
    return deleted


@router.get("/{sample_id}/download")
def download_sample(sample_id: int):
    sample = service.get_sample(sample_id)
    if sample is None:
        raise HTTPException(status_code=404, detail="Sample not found")
    
    return FileResponse(
        path=sample.path,
        media_type='application/octet-stream',
        filename=sample.path.split('/')[-1]
    )


@router.post("/{sample_id}/play")
def play_sample(sample_id: int, play_request: SamplePlayRequest) -> PlayResponse:
    return service.play_sample(sample_id, play_request)


@router.post("/{sample_id}/rename")
def rename_sample(sample_id: int, rename_request: RenameRequest) -> Response:
    renamed = service.rename_sample(sample_id, rename_request)
    if renamed is None:
        raise HTTPException(status_code=404, detail="Sample not found")
    return renamed