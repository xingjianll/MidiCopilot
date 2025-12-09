import asyncio
import threading
from typing import Dict, Any, Optional
from dataclasses import dataclass
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class RunStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class QueuedRun:
    run_id: int
    workflow_id: Optional[int]
    module_name: Optional[str]
    inputs: Dict[str, Any]
    status: RunStatus = RunStatus.PENDING
    error: Optional[str] = None
    sample_id: Optional[int] = None


class RunQueue:
    def __init__(self):
        self.queue = asyncio.Queue()
        self.active_runs: Dict[int, QueuedRun] = {}
        self.websocket_manager = None
        self._processing = False
        
    def set_websocket_manager(self, manager):
        """Set the WebSocket manager for notifications"""
        self.websocket_manager = manager
    
    async def add_run(self, run_id: int, workflow_id: Optional[int], module_name: Optional[str], inputs: Dict[str, Any]):
        """Add a run to the queue"""
        queued_run = QueuedRun(
            run_id=run_id,
            workflow_id=workflow_id,
            module_name=module_name,
            inputs=inputs
        )
        self.active_runs[run_id] = queued_run
        await self.queue.put(queued_run)
        logger.info(f"Added run {run_id} to queue")
    
    async def start_processing(self):
        """Start processing runs from the queue"""
        if self._processing:
            return
            
        self._processing = True
        logger.info("Starting queue processing")
        
        while self._processing:
            try:
                # Get next run from queue
                queued_run = await asyncio.wait_for(self.queue.get(), timeout=1.0)
                await self._process_run(queued_run)
                self.queue.task_done()
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                logger.error(f"Error processing queue: {e}")
                
    def stop_processing(self):
        """Stop processing runs"""
        self._processing = False
        logger.info("Stopped queue processing")
    
    async def _process_run(self, queued_run: QueuedRun):
        """Process a single run"""
        try:
            queued_run.status = RunStatus.RUNNING
            logger.info(f"Processing run {queued_run.run_id}")
            
            # Import here to avoid circular imports
            from src.api.run.service import execute_run_internal
            
            # Execute the run
            result = await execute_run_internal(
                run_id=queued_run.run_id,
                workflow_id=queued_run.workflow_id,
                module_name=queued_run.module_name,
                inputs=queued_run.inputs
            )
            
            # Update status
            queued_run.status = RunStatus.COMPLETED
            queued_run.sample_id = result.get('sample_id')
            
            # Notify via WebSocket
            if self.websocket_manager:
                await self.websocket_manager.notify_run_complete(
                    queued_run.run_id,
                    queued_run.sample_id
                )
            
            logger.info(f"Run {queued_run.run_id} completed successfully")
            
        except Exception as e:
            queued_run.status = RunStatus.FAILED
            queued_run.error = str(e)
            logger.error(f"Run {queued_run.run_id} failed: {e}")
            
            # Notify failure via WebSocket
            if self.websocket_manager:
                await self.websocket_manager.notify_run_failed(
                    queued_run.run_id,
                    str(e)
                )
    
    def get_run_status(self, run_id: int) -> Optional[QueuedRun]:
        """Get the status of a specific run"""
        return self.active_runs.get(run_id)


# Global queue instance
run_queue = RunQueue()


async def start_queue_processor():
    """Start the global queue processor"""
    await run_queue.start_processing()


def get_run_queue() -> RunQueue:
    """Get the global run queue instance"""
    return run_queue