import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from src.api.workflow.controller import router as workflow_router
from src.api.sample.controller import router as sample_router
from src.api.module.controller import router as module_router
from src.api.run.controller import router as run_router
from src.api.port.controller import router as port_router
from src.database import Base, engine
from src.websocket_manager import get_websocket_manager
from src.queue_manager import get_run_queue

# Create database tables
Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    websocket_manager = get_websocket_manager()
    queue = get_run_queue()
    queue.set_websocket_manager(websocket_manager)
    
    # Start queue processor in background
    queue_task = asyncio.create_task(queue.start_processing())
    
    yield
    
    # Shutdown
    queue.stop_processing()
    queue_task.cancel()
    try:
        await queue_task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title="MidiCopilot API",
    description="API for managing MIDI workflows and processing",
    version="1.0.0",
    lifespan=lifespan
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
app.include_router(run_router)
app.include_router(port_router)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    manager = get_websocket_manager()
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@app.get("/health")
def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run("src.main:app", host="127.0.0.1", port=8000, reload=True)