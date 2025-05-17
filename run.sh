#!/bin/bash

# Check if running on Linux
if [ "$(uname)" != "Linux" ]; then
    echo "This application requires Linux to run properly."
    echo "Please use WSL2 or a Linux virtual machine."
    exit 1
fi

# Check for root access
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (sudo)"
    exit 1
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a Python package is installed
python_package_exists() {
    python3 -c "import $1" >/dev/null 2>&1
}

# Function to check if a npm package is installed
npm_package_exists() {
    npm list "$1" >/dev/null 2>&1
}

# Create necessary directories if they don't exist
echo "Checking directory structure..."
mkdir -p frontend/public
mkdir -p frontend/src/components
mkdir -p frontend/src/pages
mkdir -p frontend/src/hooks

# Install system dependencies only if they don't exist
echo "Checking system dependencies..."
if ! command_exists gcc || ! command_exists python3 || ! command_exists pip3 || ! command_exists node || ! command_exists npm; then
    echo "Installing system dependencies..."
    apt-get update
    apt-get install -y build-essential python3 python3-pip nodejs npm
else
    echo "System dependencies already installed."
fi

# Install Python dependencies only if they don't exist
echo "Checking Python dependencies..."
if ! python_package_exists fastapi || ! python_package_exists uvicorn || ! python_package_exists psutil; then
    echo "Installing Python dependencies..."
    pip3 install -r requirements.txt
else
    echo "Python dependencies already installed."
fi

# Install frontend dependencies only if they don't exist
echo "Checking frontend dependencies..."
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
else
    echo "Frontend dependencies already installed."
fi

# Compile C components only if they don't exist or if source files are newer
echo "Checking C components..."
if [ ! -f "mini-docker" ] || [ "mini-docker.c" -nt "mini-docker" ]; then
    echo "Compiling mini-docker..."
    gcc mini-docker.c -o mini-docker
fi

if [ ! -f "mini-scheduler" ] || [ "mini-scheduler.c" -nt "mini-scheduler" ]; then
    echo "Compiling mini-scheduler..."
    gcc mini-scheduler.c -o mini-scheduler
fi

# Start the application
echo "Starting the application..."

# Start the backend server
python3 stats_backend.py &
BACKEND_PID=$!

# Start the frontend development server
cd frontend
npm start &
FRONTEND_PID=$!

# Start the scheduler
cd ..
./mini-scheduler &
SCHEDULER_PID=$!

# Handle cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID $SCHEDULER_PID" EXIT

# Wait for user to press Ctrl+C
echo "Application is running. Press Ctrl+C to stop."
wait 