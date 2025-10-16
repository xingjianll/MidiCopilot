from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from src.api.workflow.controller import router as workflow_router
from src.api.sample.controller import router as sample_router
from src.api.module.controller import router as module_router
from src.database import Base, engine

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MidiCopilot API",
    description="API for managing MIDI workflows and processing",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(workflow_router)
app.include_router(sample_router)
app.include_router(module_router)

@app.get("/health")
def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run("src.main:app", host="127.0.0.1", port=8000, reload=True)