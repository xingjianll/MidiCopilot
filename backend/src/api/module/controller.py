from fastapi import APIRouter

from src.core.module import ModuleVo
from src.api.module import service

router = APIRouter(
    prefix="/module",
    tags=["module"],
)


@router.get("/")
def get_modules() -> list[ModuleVo]:
    """Get all registered module subclasses."""
    return service.get_modules()