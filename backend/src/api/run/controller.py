from fastapi import APIRouter, HTTPException, Query

from src.api.run import service
from src.api.run.dto.run_dto import RunCreateRequest, Response, DeleteResponse

router = APIRouter(
    prefix="/run",
    tags=["run"],
)


@router.post("/")
async def create_run(run_request: RunCreateRequest) -> Response:
    return await service.create_run(run_request)


@router.get("/{run_id}")
def get_run(run_id: int) -> Response:
    run = service.get_run(run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Run not found")
    return run


@router.get("/")
def get_runs(skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=1000)) -> list[Response]:
    return service.get_runs(skip=skip, limit=limit)


@router.put("/{run_id}/duration")
def update_run_duration(run_id: int, duration: float) -> Response:
    updated_run = service.update_run_duration(run_id, duration)
    if updated_run is None:
        raise HTTPException(status_code=404, detail="Run not found")
    return updated_run


@router.delete("/{run_id}")
def delete_run(run_id: int) -> DeleteResponse:
    deleted = service.delete_run(run_id)
    if deleted is None:
        raise HTTPException(status_code=404, detail="Run not found")
    return deleted