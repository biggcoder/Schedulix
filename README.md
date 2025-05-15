# Schedulix - Custom Container System

A lightweight container system with real-time scheduling and resource visualization.

## Prerequisites

- Linux operating system (required for namespaces and cgroups)
- Python 3.8+
- Node.js and npm (for frontend)
- GCC compiler
- Root/sudo access (required for container operations)

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Install frontend dependencies:
```bash
cd forntend
npm install
```

## Running the Application

1. Start the backend server:
```bash
python stats-backend.py
```

2. Start the frontend development server:
```bash
cd forntend
npm start
```

3. Compile and run the container runtime:
```bash
gcc mini-docker.c -o mini-docker
gcc mini-scheduler.c -o mini-scheduler
sudo ./mini-scheduler
```

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Use the web interface to:
   - Create new containers
   - Monitor resource usage
   - View process scheduling
   - Manage container lifecycle

## Features

- Process isolation using Linux namespaces
- Resource management with cgroups
- Custom scheduling policies
- Real-time resource monitoring
- Web-based visualization dashboard 