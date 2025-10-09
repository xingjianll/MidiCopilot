from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pathlib import Path
import shutil
import uuid
from datetime import datetime

from src.services.aria_service import get_aria_service
from src.services.aria_variants_service import get_aria_variants_service
from src.services.sample_service import get_sample_service
from src.dto.aria_dto import AriaContinuationResponse
from src.dto.sample_dto import (
    SampleListResponse, 
    SampleResponse, 
    AddSampleRequest,
    AddSampleResponse, 
    DeleteSampleResponse
)

app = FastAPI(title="MidiCopilot API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup directories
UPLOAD_DIR = Path("data/uploads")
OUTPUT_DIR = Path("data/outputs")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    print("Initializing ARIA service...")
    get_aria_service()
    print("Initializing Sample service...")
    get_sample_service()
    print("Server ready!")


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "ok", "message": "MidiCopilot API is running"}


@app.post("/api/aria/continuation", response_model=AriaContinuationResponse)
async def generate_aria_continuation(
    file: UploadFile = File(..., description="MIDI file to continue"),
    max_length: int = Form(default=1024, description="Maximum length of generated tokens"),
    temperature: float = Form(default=0.97, description="Sampling temperature"),
    top_p: float = Form(default=0.95, description="Top-p sampling parameter"),
):
    """
    Generate a MIDI continuation using the ARIA model

    Args:
        file: Input MIDI file
        max_length: Maximum length of generated sequence (default: 1024)
        temperature: Sampling temperature (default: 0.97)
        top_p: Top-p sampling parameter (default: 0.95)

    Returns:
        AriaContinuationResponse with success status and output file info
    """
    # Validate file type
    if not file.filename.endswith(('.mid', '.midi')):
        raise HTTPException(status_code=400, detail="File must be a MIDI file (.mid or .midi)")

    try:
        # Generate unique ID for this request
        request_id = str(uuid.uuid4())
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        # Save uploaded file
        input_filename = f"{timestamp}_{request_id}_input.mid"
        input_path = UPLOAD_DIR / input_filename
        with input_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Generate output path
        output_filename = f"{timestamp}_{request_id}_continuation.mid"
        output_path = OUTPUT_DIR / output_filename

        # Get ARIA service and generate continuation
        aria_service = get_aria_service()
        result = aria_service.generate_continuation(
            prompt_midi_path=str(input_path),
            output_midi_path=str(output_path),
            max_length=max_length,
            temperature=temperature,
            top_p=top_p
        )

        if result["success"]:
            return AriaContinuationResponse(
                success=True,
                message=result["message"],
                continuation_filename=output_filename
            )
        else:
            return AriaContinuationResponse(
                success=False,
                message=result["message"],
                error=result.get("error")
            )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")
    finally:
        # Close the uploaded file
        await file.close()


@app.post("/api/aria/continuation/stream")
async def generate_aria_continuation_stream(
    file: UploadFile = File(..., description="MIDI file to continue"),
    max_length: int = Form(default=1024, description="Maximum length of generated tokens"),
    temperature: float = Form(default=0.97, description="Sampling temperature"),
    top_p: float = Form(default=0.95, description="Top-p sampling parameter"),
):
    """
    Generate a MIDI continuation with real-time progress updates (SSE)

    Args:
        file: Input MIDI file
        max_length: Maximum length of generated sequence (default: 1024)
        temperature: Sampling temperature (default: 0.97)
        top_p: Top-p sampling parameter (default: 0.95)

    Returns:
        Server-Sent Events stream with progress updates
    """
    # Validate file type
    if not file.filename.endswith(('.mid', '.midi')):
        raise HTTPException(status_code=400, detail="File must be a MIDI file (.mid or .midi)")

    try:
        # Generate unique ID for this request
        request_id = str(uuid.uuid4())
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        # Save uploaded file
        input_filename = f"{timestamp}_{request_id}_input.mid"
        input_path = UPLOAD_DIR / input_filename
        with input_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Generate output path
        output_filename = f"{timestamp}_{request_id}_continuation.mid"
        output_path = OUTPUT_DIR / output_filename

        # Get ARIA service and generate continuation with streaming
        aria_service = get_aria_service()

        def event_stream():
            yield from aria_service.generate_continuation_stream(
                prompt_midi_path=str(input_path),
                output_midi_path=str(output_path),
                max_length=max_length,
                temperature=temperature,
                top_p=top_p
            )

        return StreamingResponse(
            event_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"  # Disable buffering for nginx
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")
    finally:
        # Close the uploaded file
        await file.close()


@app.get("/api/aria/download/{filename}")
async def download_continuation(filename: str):
    """
    Download a generated MIDI continuation file

    Args:
        filename: Name of the file to download

    Returns:
        FileResponse with the MIDI file
    """
    file_path = OUTPUT_DIR / filename

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        path=file_path,
        media_type="audio/midi",
        filename=filename
    )


# ARIA Harmony Endpoints

@app.post("/api/aria-harmony/continuation/stream")
async def generate_aria_harmony_stream(
    file: UploadFile = File(..., description="MIDI file for harmonic generation"),
    max_length: int = Form(1024, description="Maximum length of generated sequence"),
    temperature: float = Form(0.97, description="Sampling temperature"),
    top_p: float = Form(0.95, description="Top-p sampling parameter"),
    ignore_prompt: bool = Form(False, description="Whether to ignore the prompt")
):
    """
    Generate harmonic continuation using ARIA Harmony model with streaming progress
    
    Args:
        file: Input MIDI file
        max_length: Maximum tokens to generate
        temperature: Controls randomness (0.0 to 1.0)
        top_p: Nucleus sampling parameter
        ignore_prompt: Generate from scratch ignoring the input
    
    Returns:
        Server-Sent Events stream with progress updates
    """
    # Validate file type
    if not file.filename.endswith(('.mid', '.midi')):
        raise HTTPException(status_code=400, detail="File must be a MIDI file (.mid or .midi)")

    try:
        # Generate unique ID for this request
        request_id = str(uuid.uuid4())
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        # Save uploaded file
        input_filename = f"{timestamp}_{request_id}_input.mid"
        input_path = UPLOAD_DIR / input_filename
        with input_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Generate output path
        output_filename = f"{timestamp}_{request_id}_harmony.mid"
        output_path = OUTPUT_DIR / output_filename

        # Get the ARIA variants service
        aria_variants = get_aria_variants_service()

        # Generate continuation with streaming
        def event_stream():
            yield from aria_variants.generate_harmony_stream(
                prompt_midi_path=str(input_path),
                output_midi_path=str(output_path),
                max_length=max_length,
                temperature=temperature,
                top_p=top_p,
                ignore_prompt=ignore_prompt
            )

        return StreamingResponse(
            event_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"  # Disable buffering for nginx
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating harmony: {str(e)}")


# ARIA Style (Chopin) Endpoints

@app.post("/api/aria-style/continuation/stream")
async def generate_aria_style_stream(
    file: UploadFile = File(..., description="MIDI file for style generation"),
    max_length: int = Form(1024, description="Maximum length of generated sequence"),
    temperature: float = Form(0.97, description="Sampling temperature"),
    top_p: float = Form(0.95, description="Top-p sampling parameter"),
    ignore_prompt: bool = Form(False, description="Whether to ignore the prompt")
):
    """
    Generate Chopin-style continuation using ARIA Style model with streaming progress
    
    Args:
        file: Input MIDI file
        max_length: Maximum tokens to generate
        temperature: Controls randomness (0.0 to 1.0)
        top_p: Nucleus sampling parameter
        ignore_prompt: Generate from scratch ignoring the input
    
    Returns:
        Server-Sent Events stream with progress updates
    """
    # Validate file type
    if not file.filename.endswith(('.mid', '.midi')):
        raise HTTPException(status_code=400, detail="File must be a MIDI file (.mid or .midi)")

    try:
        # Generate unique ID for this request
        request_id = str(uuid.uuid4())
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        # Save uploaded file
        input_filename = f"{timestamp}_{request_id}_input.mid"
        input_path = UPLOAD_DIR / input_filename
        with input_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Generate output path
        output_filename = f"{timestamp}_{request_id}_chopin.mid"
        output_path = OUTPUT_DIR / output_filename

        # Get the ARIA variants service
        aria_variants = get_aria_variants_service()

        # Generate continuation with streaming
        def event_stream():
            yield from aria_variants.generate_style_stream(
                prompt_midi_path=str(input_path),
                output_midi_path=str(output_path),
                max_length=max_length,
                temperature=temperature,
                top_p=top_p,
                ignore_prompt=ignore_prompt
            )

        return StreamingResponse(
            event_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"  # Disable buffering for nginx
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating style: {str(e)}")


# Sample Management Endpoints

@app.get("/api/samples", response_model=SampleListResponse)
async def list_samples():
    """
    List all saved samples
    
    Returns:
        List of sample metadata
    """
    try:
        sample_service = get_sample_service()
        samples = sample_service.list_samples()
        
        return SampleListResponse(
            samples=[SampleResponse(**sample) for sample in samples],
            count=len(samples)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing samples: {str(e)}")


@app.post("/api/samples", response_model=AddSampleResponse)
async def add_sample_from_file(file: UploadFile = File(..., description="MIDI file to add as sample")):
    """
    Add a MIDI file as a sample
    
    Args:
        file: MIDI file to add
        
    Returns:
        Sample metadata
    """
    # Validate file type
    if not file.filename.endswith(('.mid', '.midi')):
        raise HTTPException(status_code=400, detail="File must be a MIDI file (.mid or .midi)")
    
    try:
        # Save uploaded file temporarily
        temp_path = UPLOAD_DIR / f"temp_{uuid.uuid4()}_{file.filename}"
        with temp_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Add to samples
        sample_service = get_sample_service()
        sample = sample_service.add_sample(
            file_path=str(temp_path),
            name=file.filename.rsplit('.', 1)[0],  # Remove extension
            source="upload"
        )
        
        # Clean up temp file
        temp_path.unlink()
        
        return AddSampleResponse(
            success=True,
            message="Sample added successfully",
            sample=SampleResponse(**sample)
        )
        
    except Exception as e:
        # Clean up on error
        if 'temp_path' in locals() and temp_path.exists():
            temp_path.unlink()
        
        return AddSampleResponse(
            success=False,
            message="Failed to add sample",
            error=str(e)
        )
    finally:
        await file.close()


@app.post("/api/samples/path", response_model=AddSampleResponse)
async def add_sample_from_path(request: AddSampleRequest):
    """
    Add a MIDI file as a sample from a file path
    
    Args:
        request: Contains file path and optional name
        
    Returns:
        Sample metadata
    """
    try:
        sample_service = get_sample_service()
        sample = sample_service.add_sample(
            file_path=request.file_path,
            name=request.name,
            source="path"
        )
        
        return AddSampleResponse(
            success=True,
            message="Sample added successfully",
            sample=SampleResponse(**sample)
        )
        
    except Exception as e:
        return AddSampleResponse(
            success=False,
            message="Failed to add sample",
            error=str(e)
        )


@app.delete("/api/samples/{sample_id}", response_model=DeleteSampleResponse)
async def delete_sample(sample_id: str):
    """
    Delete a sample by ID
    
    Args:
        sample_id: ID of the sample to delete
        
    Returns:
        Success status
    """
    try:
        sample_service = get_sample_service()
        success = sample_service.delete_sample(sample_id)
        
        if success:
            return DeleteSampleResponse(
                success=True,
                message="Sample deleted successfully"
            )
        else:
            return DeleteSampleResponse(
                success=False,
                message="Sample not found",
                error="Sample with the given ID does not exist"
            )
            
    except Exception as e:
        return DeleteSampleResponse(
            success=False,
            message="Failed to delete sample",
            error=str(e)
        )


@app.get("/api/samples/{sample_id}/download")
async def download_sample(sample_id: str):
    """
    Download a sample MIDI file
    
    Args:
        sample_id: ID of the sample to download
        
    Returns:
        FileResponse with the MIDI file
    """
    try:
        sample_service = get_sample_service()
        sample = sample_service.get_sample(sample_id)
        
        if not sample:
            raise HTTPException(status_code=404, detail="Sample not found")
        
        file_path = Path(sample['path'])
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Sample file not found")
        
        return FileResponse(
            path=file_path,
            media_type="audio/midi",
            filename=sample['filename']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error downloading sample: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
