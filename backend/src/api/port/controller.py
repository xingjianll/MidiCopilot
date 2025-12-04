from fastapi import APIRouter, HTTPException

from src.api.port import service
from src.api.port.dto.port_dto import PortResponse

router = APIRouter(
    prefix="/port",
    tags=["port"],
)


@router.get("/")
def get_ports() -> list[PortResponse]:
    """Get all available MIDI ports"""
    try:
        return service.get_midi_ports()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get MIDI ports: {str(e)}")


@router.get("/output")
def get_output_ports() -> list[PortResponse]:
    """Get only MIDI output ports"""
    try:
        return service.get_output_ports()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get MIDI output ports: {str(e)}")