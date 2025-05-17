from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import psutil
import time
import asyncio
from typing import List, Dict

app = FastAPI(title="Schedulix Stats API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store WebSocket connections
active_connections: List[WebSocket] = []

# Mock container data for testing
mock_containers = [
    {
        "id": "container1",
        "name": "Test Container 1",
        "cpu_percent": 25.5,
        "memory_usage": 512 * 1024 * 1024,  # 512MB
        "status": "running",
        "processes": [
            {
                "pid": 1001,
                "name": "process1",
                "cpu_percent": 15.5,
                "memory_percent": 2.5
            },
            {
                "pid": 1002,
                "name": "process2",
                "cpu_percent": 10.0,
                "memory_percent": 1.5
            }
        ]
    },
    {
        "id": "container2",
        "name": "Test Container 2",
        "cpu_percent": 35.2,
        "memory_usage": 768 * 1024 * 1024,  # 768MB
        "status": "running",
        "processes": [
            {
                "pid": 2001,
                "name": "process3",
                "cpu_percent": 20.2,
                "memory_percent": 3.5
            },
            {
                "pid": 2002,
                "name": "process4",
                "cpu_percent": 15.0,
                "memory_percent": 2.5
            }
        ]
    }
]

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    try:
        while True:
            # Send mock data every second
            await websocket.send_json({
                "containers": mock_containers,
                "timestamp": time.time()
            })
            await asyncio.sleep(1)
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        active_connections.remove(websocket)

@app.get("/stats")
async def get_stats():
    return {
        "containers": mock_containers,
        "timestamp": time.time()
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 