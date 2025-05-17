# Schedulix - Custom Container System

A lightweight container runtime with real-time scheduling and resource visualization.

## Project Structure

```
schedulix/
├── core/                           # Core container runtime
│   ├── src/
│   │   ├── container/             # Container implementation
│   │   │   ├── container.c        # Main container logic
│   │   │   ├── container.h        # Container headers
│   │   │   ├── namespace.c        # Namespace isolation
│   │   │   ├── cgroup.c          # Resource management
│   │   │   └── network.c         # Network isolation
│   │   │
│   │   ├── scheduler/            # Custom scheduler
│   │   │   ├── scheduler.c       # Scheduler implementation
│   │   │   ├── scheduler.h       # Scheduler headers
│   │   │   ├── policy.c          # Scheduling policies
│   │   │   └── metrics.c         # Performance metrics
│   │   │
│   │   └── cli/                  # Command-line tools
│   │       ├── mini-run.c        # Container runner
│   │       ├── mini-stop.c       # Container stopper
│   │       └── mini-stats.c      # Stats viewer
│   │
│   ├── include/                  # Public headers
│   └── CMakeLists.txt           # Build configuration
│
├── backend/                      # Stats & Control Backend
│   ├── src/
│   │   ├── monitor/             # Resource monitoring
│   │   │   ├── cpu.py           # CPU stats collector
│   │   │   ├── memory.py        # Memory stats collector
│   │   │   └── gpu.py           # GPU stats collector
│   │   │
│   │   ├── api/                 # API endpoints
│   │   │   ├── routes.py        # REST API routes
│   │   │   └── websocket.py     # WebSocket handlers
│   │   │
│   │   └── scheduler/           # Scheduler control
│   │       ├── controller.py    # Scheduler controller
│   │       └── policies.py      # Scheduling policies
│   │
│   ├── requirements.txt         # Python dependencies
│   └── main.py                 # Backend entry point
│
├── frontend/                    # Visualization Dashboard
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── charts/        # Data visualization
│   │   │   │   ├── Timeline.jsx    # Process timeline
│   │   │   │   ├── ResourceChart.jsx # Resource usage
│   │   │   │   └── ProcessTree.jsx  # Process hierarchy
│   │   │   │
│   │   │   ├── containers/    # Container management
│   │   │   │   ├── ContainerList.jsx
│   │   │   │   ├── ContainerCard.jsx
│   │   │   │   └── ContainerStats.jsx
│   │   │   │
│   │   │   └── common/        # Shared components
│   │   │       ├── Sidebar.jsx
│   │   │       └── Header.jsx
│   │   │
│   │   ├── pages/            # Page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Containers.jsx
│   │   │   ├── Scheduler.jsx
│   │   │   └── Settings.jsx
│   │   │
│   │   ├── hooks/           # Custom React hooks
│   │   │   ├── useWebSocket.js
│   │   │   └── useContainer.js
│   │   │
│   │   └── utils/          # Utility functions
│   │       ├── api.js      # API client
│   │       └── formatters.js
│   │
│   ├── public/            # Static assets
│   │   ├── index.html
│   │   └── manifest.json
│   │
│   └── package.json      # Frontend dependencies
│
├── scripts/              # Build and utility scripts
│   ├── build.sh         # Build script
│   ├── run.sh           # Run script
│   └── setup.sh         # Setup script
│
└── docs/                # Documentation
    ├── api.md          # API documentation
    ├── architecture.md # System architecture
    └── development.md  # Development guide
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