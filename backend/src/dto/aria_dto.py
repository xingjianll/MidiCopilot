from pydantic import BaseModel, Field


class AriaContinuationRequest(BaseModel):
    """Request model for Aria MIDI continuation generation"""
    max_length: int = Field(default=1024, description="Maximum length of generated tokens")
    temperature: float = Field(default=0.97, ge=0.1, le=2.0, description="Sampling temperature")
    top_p: float = Field(default=0.95, ge=0.0, le=1.0, description="Top-p sampling parameter")


class AriaContinuationResponse(BaseModel):
    """Response model for Aria MIDI continuation generation"""
    success: bool
    message: str
    continuation_filename: str | None = None
    error: str | None = None
