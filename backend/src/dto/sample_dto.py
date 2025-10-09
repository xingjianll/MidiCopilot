from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


class SampleResponse(BaseModel):
    """Response model for a sample"""
    id: str
    name: str
    filename: str
    path: str
    size: int
    source: str
    createdAt: str
    format: str
    metadata: Dict[str, Any] = {}


class SampleListResponse(BaseModel):
    """Response model for sample list"""
    samples: list[SampleResponse]
    count: int


class AddSampleRequest(BaseModel):
    """Request model for adding a sample from path"""
    file_path: str = Field(..., description="Path to the MIDI file to add")
    name: Optional[str] = Field(None, description="Custom name for the sample")


class AddSampleResponse(BaseModel):
    """Response model for adding a sample"""
    success: bool
    message: str
    sample: Optional[SampleResponse] = None
    error: Optional[str] = None


class DeleteSampleResponse(BaseModel):
    """Response model for deleting a sample"""
    success: bool
    message: str
    error: Optional[str] = None