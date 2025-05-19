# Schedulix - Custom Container System

A lightweight container runtime with real-time scheduling and resource visualization.

## Project Structure

```
 Schedulix/
├── frontend/                 # React-based web dashboard
├── mini-docker.c            # Container runtime implementation
├── mini-scheduler.c         # Custom scheduler implementation
├── stats_backend.py         # FastAPI monitoring backend
├── requirements.txt         # Python dependencies
└── Dockerfile              # Container build configuration
```

## Features

- **Custom Container Runtime**
  - Process isolation using Linux namespaces
  - Resource management with cgroups
  - Network isolation with veth pairs
  - Custom scheduling policies

- **Real-time Monitoring**
  - CPU, Memory, and GPU usage tracking
  - Process scheduling visualization
  - Live container statistics

- **Web Dashboard**
  - Interactive process timeline
  - Resource usage charts
  - Container management interface
  - Real-time updates via WebSocket

## Setup

1. **Prerequisites**
   ```bash
   # Install system dependencies
   sudo apt-get update
   sudo apt-get install -y build-essential cmake python3-pip nodejs npm
   ```

2. **Build Core Runtime**
   ```bash
   cd core
   mkdir build && cd build
   cmake ..
   make
   ```

3. **Setup Backend**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

4. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   ```

5. **Run the System**
   ```bash
   ./scripts/run.sh
   ```

## Development

- Core runtime is written in C
- Backend uses Python with FastAPI
- Frontend uses React with Material-UI and D3.js

## License

MIT License 
