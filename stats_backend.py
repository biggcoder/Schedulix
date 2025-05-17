#!/usr/bin/env python3
# stats_backend.py - Stats collection and API backend

import os
import time
import json
import threading
import subprocess
import platform
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from typing import Dict, List, Optional
import psutil
import asyncio
from pydantic import BaseModel

# Initialize FastAPI app
app = FastAPI(title="Mini-Docker Stats API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class ContainerConfig(BaseModel):
    id: str
    command: str
    cpu_shares: int
    memory_limit: int
    policy: int = 0
    priority: int = 50

class ContainerStats(BaseModel):
    id: str
    pid: int
    cpu_percent: float
    memory_usage: int
    memory_limit: int
    processes: List[Dict]
    scheduling_info: Dict

# In-memory storage
containers = {}
container_stats = {}
active_connections: List[WebSocket] = []
last_stats_update = 0
STATS_UPDATE_INTERVAL = 1.0  # Update stats every second

# WebSocket management
async def register_websocket(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)

def unregister_websocket(websocket: WebSocket):
    if websocket in active_connections:
        active_connections.remove(websocket)

async def broadcast_stats():
    if not active_connections:
        return

    global last_stats_update
    current_time = time.time()
    
    # Only update stats if enough time has passed
    if current_time - last_stats_update < STATS_UPDATE_INTERVAL:
        return

    last_stats_update = current_time
    
    # Prepare stats payload
    payload = {
        "containers": list(container_stats.values()),
        "timestamp": current_time
    }
    
    # Send to all connected clients
    disconnected_connections = []
    for connection in active_connections:
        try:
            await connection.send_json(payload)
        except WebSocketDisconnect:
            disconnected_connections.append(connection)
        except Exception as e:
            print(f"Error sending to WebSocket: {e}")
            disconnected_connections.append(connection)
    
    # Remove disconnected connections
    for connection in disconnected_connections:
        unregister_websocket(connection)

# Process information collection
def get_process_info(pid):
    try:
        proc = psutil.Process(pid)
        return {
            "pid": pid,
            "name": proc.name(),
            "cpu_percent": proc.cpu_percent(interval=0.1),
            "memory_percent": proc.memory_percent(),
            "status": proc.status(),
            "create_time": proc.create_time(),
            "num_threads": proc.num_threads(),
            "nice": proc.nice()
        }
    except (psutil.NoSuchProcess, psutil.AccessDenied):
        return None

def get_container_processes(container_pid):
    processes = []
    try:
        parent = psutil.Process(container_pid)
        children = parent.children(recursive=True)
        
        # Add parent process
        parent_info = get_process_info(container_pid)
        if parent_info:
            processes.append(parent_info)
        
        # Add child processes
        for child in children:
            child_info = get_process_info(child.pid)
            if child_info:
                processes.append(child_info)
    except (psutil.NoSuchProcess, psutil.AccessDenied):
        pass
    
    return processes

# Platform-specific stats collection
def get_platform_stats(container_id):
    stats = {}
    
    if platform.system() == "Linux":
        # Linux-specific stats (cgroups)
        cgroup_path = f"/sys/fs/cgroup/mini/{container_id}"
        try:
            with open(f"{cgroup_path}/cpu.stat", "r") as f:
                for line in f:
                    if "usage_usec" in line:
                        stats["cpu_usage_usec"] = int(line.strip().split()[1])
            
            with open(f"{cgroup_path}/memory.current", "r") as f:
                stats["memory_current"] = int(f.read().strip())
        except (FileNotFoundError, IOError):
            pass
    else:
        # Windows/other platforms
        stats["cpu_usage_usec"] = 0
        stats["memory_current"] = 0
    
    return stats

async def update_container_stats():
    """Update container statistics periodically"""
    while True:
        try:
            # For testing, use mock data
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
            
            # Update container stats
            for container in mock_containers:
                container_stats[container["id"]] = container
            
            # Broadcast updates to connected clients
            await broadcast_stats()
            
            # Wait for the next update interval
            await asyncio.sleep(STATS_UPDATE_INTERVAL)
            
        except Exception as e:
            print(f"Error updating container stats: {e}")
            await asyncio.sleep(STATS_UPDATE_INTERVAL)

# API endpoints
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await register_websocket(websocket)
    try:
        while True:
            # Wait for client to disconnect
            await websocket.receive_text()
    except WebSocketDisconnect:
        unregister_websocket(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        unregister_websocket(websocket)

@app.get("/stats")
async def get_stats():
    return {
        "containers": list(container_stats.values()),
        "timestamp": time.time()
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Startup event
@app.on_event("startup")
async def startup_event():
    # Start the stats update loop
    asyncio.create_task(update_container_stats())

# Main function
def main():
    uvicorn.run(app, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    main()