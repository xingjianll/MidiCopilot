import asyncio
import json
import logging
from typing import Set
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)


class WebSocketManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
    
    async def connect(self, websocket: WebSocket):
        """Accept a WebSocket connection"""
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection"""
        self.active_connections.discard(websocket)
        logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")
    
    async def send_to_all(self, message: dict):
        """Send a message to all connected clients"""
        if not self.active_connections:
            return
            
        message_str = json.dumps(message)
        disconnected = set()
        
        for connection in self.active_connections:
            try:
                await connection.send_text(message_str)
            except Exception as e:
                logger.warning(f"Failed to send message to WebSocket: {e}")
                disconnected.add(connection)
        
        # Remove disconnected connections
        for connection in disconnected:
            self.active_connections.discard(connection)
    
    async def notify_run_complete(self, run_id: int, sample_id: int = None):
        """Notify all clients that a run has completed"""
        message = {
            "type": "run_complete",
            "run_id": run_id,
            "sample_id": sample_id,
            "message": f"Run {run_id} completed successfully"
        }
        await self.send_to_all(message)
        logger.info(f"Notified run completion: {run_id}")
    
    async def notify_run_failed(self, run_id: int, error: str):
        """Notify all clients that a run has failed"""
        message = {
            "type": "run_failed",
            "run_id": run_id,
            "error": error,
            "message": f"Run {run_id} failed: {error}"
        }
        await self.send_to_all(message)
        logger.info(f"Notified run failure: {run_id}")


# Global WebSocket manager instance
websocket_manager = WebSocketManager()


def get_websocket_manager() -> WebSocketManager:
    """Get the global WebSocket manager instance"""
    return websocket_manager