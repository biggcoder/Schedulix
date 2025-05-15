#!/usr/bin/env python3
# stats_backend.py - Stats collection and API backend

import os
import time
import json
import threading
import subprocess
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
    allow_origins=["*"],  # For development. In production, specify exact domains
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
    policy: int = 0  # Default: fair scheduling
    priority: int = 50  # Default: medium priority

class ContainerStats(BaseModel):
    id: str
    pid: int
    cpu_percent: float
    memory_usage: int
    memory_limit: int
    processes: List[Dict]
    scheduling_info: Dict

# In-memory storage for container info
containers = {}
container_stats = {}

# WebSocket connections
active_connections: List[WebSocket] = []

# Register new WebSocket connection
async def register_websocket(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)

# Unregister WebSocket connection
def unregister_websocket(websocket: WebSocket):
    if websocket in active_connections:
        active_connections.remove(websocket)

# Broadcast stats to all connected clients
async def broadcast_stats():
    if active_connections:
        # Prepare stats payload
        payload = {
            "containers": list(container_stats.values()),
            "timestamp": time.time()
        }
        
        # Send to all connected clients
        for connection in active_connections:
            try:
                await connection.send_json(payload)
            except WebSocketDisconnect:
                # Will be removed in the next iteration
                pass
            except Exception as e:
                print(f"Error sending to WebSocket: {e}")

# Read process information from /proc filesystem
def get_process_info(pid):
    try:
        proc = psutil.Process(pid)
        return {
            "pid": pid,
            "name": proc.name(),
            "cpu_percent": proc.cpu_percent(),
            "memory_percent": proc.memory_percent(),
            "status": proc.status(),
            "create_time": proc.create_time(),
            "num_threads": proc.num_threads(),
            "nice": proc.nice()
        }
    except (psutil.NoSuchProcess, psutil.AccessDenied):
        return None

# Get all child processes of a container
def get_container_processes(container_pid):
    processes = []
    try:
        parent = psutil.Process(container_pid)
        children = parent.children(recursive=True)
        
        # Add the parent process
        parent_info = get_process_info(container_pid)
        if parent_info:
            processes.append(parent_info)
        
        # Add all child processes
        for child in children:
            child_info = get_process_info(child.pid)
            if child_info:
                processes.append(child_info)
    except (psutil.NoSuchProcess, psutil.AccessDenied):
        pass
    
    return processes

# Read cgroup stats for a container
def read_cgroup_stats(container_id):
    stats = {}
    cgroup_path = f"/sys/fs/cgroup/mini/{container_id}"
    
    try:
        # Read CPU usage
        with open(f"{cgroup_path}/cpu.stat", "r") as f:
            for line in f:
                if "usage_usec" in line:
                    parts = line.strip().split()
                    stats["cpu_usage_usec"] = int(parts[1])
        
        # Read memory stats
        with open(f"{cgroup_path}/memory.current", "r") as f:
            stats["memory_current"] = int(f.read().strip())
        
        with open(f"{cgroup_path}/memory.max", "r") as f:
            content = f.read().strip()
            stats["memory_max"] = int(content) if content != "max" else -1
        
        # Read CPU shares
        with open(f"{cgroup_path}/cpu.weight", "r") as f:
            stats["cpu_weight"] = int(f.read().strip())
    
    except (FileNotFoundError, IOError) as e:
        print(f"Error reading cgroup stats for {container_id}: {e}")
    
    return stats

# Get GPU stats using nvidia-smi (if available)
def get_gpu_stats():
    try:
        output = subprocess.check_output(["nvidia-smi", "--query-gpu=index,utilization.gpu,memory.used,memory.total", "--format=csv,noheader,nounits"]).decode("utf-8")
        gpus = []
        
        for line in output.strip().split('\n'):
            values = [value.strip() for value in line.split(',')]
            gpus.append({
                "index": int(values[0]),
                "utilization": float(values[1]),
                "memory_used": int(values[2]),
                "memory_total": int(values[3])
            })
        
        return gpus
    except (subprocess.SubprocessError, FileNotFoundError):
        # No NVIDIA GPUs available
        return []

# Update stats for all containers
async def update_container_stats():
    while True:
        try:
            # Make a copy to avoid modification during iteration
            container_ids = list(containers.keys())
            
            for container_id in container_ids:
                if container_id not in containers:
                    continue
                    
                container = containers[container_id]
                pid = container.get("pid")
                
                if not pid or not psutil.pid_exists(pid):
                    # Container no longer exists
                    containers.pop(container_id, None)
                    container_stats.pop(container_id, None)
                    continue
                
                # Get all processes in the container
                processes = get_container_processes(pid)
                
                # Read cgroup stats
                cgroup_stats = read_cgroup_stats(container_id)
                
                # Calculate CPU usage for the container
                cpu_percent = sum(proc.get("cpu_percent", 0) for proc in processes)
                
                # Get memory usage
                memory_usage = cgroup_stats.get("memory_current", 0)
                memory_limit = cgroup_stats.get("memory_max", -1)
                
                # Update container stats
                container_stats[container_id] = {
                    "id": container_id,
                    "pid": pid,
                    "cpu_percent": cpu_percent,
                    "memory_usage": memory_usage,
                    "memory_limit": memory_limit,
                    "processes": processes,
                    "scheduling_info": {
                        "policy": container.get("policy", 0),
                        "priority": container.get("priority", 50),
                        "cpu_weight": cgroup_stats.get("cpu_weight", 100)
                    }
                }
            
            # Broadcast updated stats
            await broadcast_stats()
            
        except Exception as e:
            print(f"Error updating container stats: {e}")
        
        # Update every second
        await asyncio.sleep(1)

# WebSocket endpoint for real-time updates
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await register_websocket(websocket)
    try:
        while True:
            # Just keep the connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        unregister_websocket(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        unregister_websocket(websocket)

# API endpoint to register a container
@app.post("/containers/")
async def register_container(config: ContainerConfig):
    containers[config.id] = {
        "id": config.id,
        "command": config.command,
        "cpu_shares": config.cpu_shares,
        "memory_limit": config.memory_limit,
        "policy": config.policy,
        "priority": config.priority
    }
    return {"status": "registered", "id": config.id}

# API endpoint to update container PID
@app.put("/containers/{container_id}/pid/{pid}")
async def update_container_pid(container_id: str, pid: int):
    if container_id in containers:
        containers[container_id]["pid"] = pid
        return {"status": "updated", "id": container_id, "pid": pid}
    return {"status": "error", "message": "Container not found"}

# API endpoint to update container scheduling policy
@app.put("/containers/{container_id}/scheduling")
async def update_container_scheduling(container_id: str, policy: int, priority: int):
    if container_id in containers:
        containers[container_id]["policy"] = policy
        containers[container_id]["priority"] = priority
        return {"status": "updated", "id": container_id}
    return {"status": "error", "message": "Container not found"}

# API endpoint to get all container stats
@app.get("/stats")
async def get_stats():
    return {
        "containers": list(container_stats.values()),
        "gpu": get_gpu_stats(),
        "timestamp": time.time()
    }

# API endpoint to stop a container
@app.delete("/containers/{container_id}")
async def stop_container(container_id: str):
    if container_id in containers:
        container = containers[container_id]
        pid = container.get("pid")
        
        if pid and psutil.pid_exists(pid):
            try:
                proc = psutil.Process(pid)
                proc.terminate()
                
                # Wait for a bit and force kill if necessary
                try:
                    proc.wait(timeout=5)
                except psutil.TimeoutExpired:
                    proc.kill()
            except psutil.NoSuchProcess:
                pass
        
        # Remove from our records
        containers.pop(container_id, None)
        container_stats.pop(container_id, None)
        
        return {"status": "stopped", "id": container_id}
    
    return {"status": "error", "message": "Container not found"}

# Get scheduling metrics for visualization
@app.get("/metrics/scheduling")
async def get_scheduling_metrics():
    metrics = []
    
    # For each container, collect scheduling data
    for container_id, stats in container_stats.items():
        processes = stats.get("processes", [])
        
        for proc in processes:
            metrics.append({
                "container_id": container_id,
                "pid": proc["pid"],
                "name": proc["name"],
                "cpu_percent": proc["cpu_percent"],
                "status": proc["status"],
                "timestamp": time.time()
            })
    
    return {"metrics": metrics}

# Start the stats update loop when the app starts
@app.on_event("startup")
async def startup_event():
    # Start the stats update loop
    asyncio.create_task(update_container_stats())

# Main function to run the FastAPI app
def main():
    uvicorn.run("stats_backend:app", host="0.0.0.0", port=8000, reload=True)

if __name__ == "__main__":
    main()