// src/App.jsx - Main React application for visualizing container metrics

import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Clock, Activity, Cpu, Database, Zap, PlayCircle, StopCircle, Settings } from 'lucide-react';

// Custom hooks for data management
function useWebSocket(url) {
  const [data, setData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    // Connect to WebSocket
    const connect = () => {
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
      };
      
      ws.onmessage = (event) => {
        try {
          const parsedData = JSON.parse(event.data);
          setData(parsedData);
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        // Reconnect after 2 seconds
        setTimeout(connect, 2000);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        ws.close();
      };
      
      wsRef.current = ws;
    };
    
    connect();
    
    // Cleanup function
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [url]);
  
  return { data, isConnected };
}

// Custom hook for time-series data
function useTimeSeriesData(initialValue = {}, maxPoints = 30) {
  const [timeSeriesData, setTimeSeriesData] = useState({});
  
  const addDataPoint = (key, value, timestamp) => {
    setTimeSeriesData(prev => {
      const series = prev[key] || [];
      const newPoint = { value, timestamp };
      // Keep only the last maxPoints
      const newSeries = [...series, newPoint].slice(-maxPoints);
      return { ...prev, [key]: newSeries };
    });
  };
  
  return [timeSeriesData, addDataPoint];
}

// Container Overview component
function ContainerOverview({ containers }) {
  if (!containers || containers.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No containers running</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {containers.map(container => (
        <div key={container.id} className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-lg">{container.id}</h3>
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Running</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="flex items-center">
              <Cpu size={16} className="mr-2 text-blue-500" />
              <span className="text-sm text-gray-700">CPU: {container.cpu_percent.toFixed(1)}%</span>
            </div>
            <div className="flex items-center">
              <Database size={16} className="mr-2 text-purple-500" />
              <span className="text-sm text-gray-700">
                Memory: {(container.memory_usage / (1024 * 1024)).toFixed(1)} MB
              </span>
            </div>
            <div className="flex items-center">
              <Zap size={16} className="mr-2 text-yellow-500" />
              <span className="text-sm text-gray-700">
                Processes: {container.processes.length}
              </span>
            </div>
            <div className="flex items-center">
              <Activity size={16} className="mr-2 text-red-500" />
              <span className="text-sm text-gray-700">
                Priority: {container.scheduling_info.priority}
              </span>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <button className="bg-red-50 text-red-600 p-1 rounded hover:bg-red-100">
              <StopCircle size={18} />
            </button>
            <button className="bg-blue-50 text-blue-600 p-1 rounded hover:bg-blue-100">
              <Settings size={18} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// CPU Usage Chart component
function CPUUsageChart({ timeSeriesData }) {
  // Extract all timestamps (union) and sort them
  const allTimestampsSet = new Set();
  Object.values(timeSeriesData).forEach(series => {
    series.forEach(point => allTimestampsSet.add(point.timestamp));
  });
  const allTimestamps = Array.from(allTimestampsSet).sort();

  // Build chart data points with CPU usage per container per timestamp
  const chartData = allTimestamps.map(timestamp => {
    const point = { timestamp };
    Object.entries(timeSeriesData).forEach(([containerId, series]) => {
      // Find value for this timestamp, fallback to 0 if not found
      const dataPoint = series.find(p => p.timestamp === timestamp);
      point[containerId] = dataPoint ? dataPoint.value : 0;
    });
    return point;
  });

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-bold mb-4">CPU Usage</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={timestamp => new Date(timestamp).toLocaleTimeString()} 
              domain={['auto', 'auto']}
              type="number"
            />
            <YAxis />
            <Tooltip 
              labelFormatter={timestamp => new Date(timestamp).toLocaleTimeString()}
              formatter={(value, name) => [`${value.toFixed(1)}%`, name]}
            />
            <Legend />
            {Object.keys(timeSeriesData).map((containerId, idx) => (
              <Line 
                key={containerId}
                type="monotone"
                dataKey={containerId} // dynamically use container id as key
                name={containerId}
                stroke={`hsl(${(idx * 60) % 360}, 70%, 50%)`}
                activeDot={{ r: 8 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Memory Usage Chart component
function MemoryUsageChart({ timeSeriesData }) {
  const chartData = Object.entries(timeSeriesData).map(([containerId, series]) => {
    const latestPoint = series[series.length - 1];
    return {
      id: containerId,
      memory: latestPoint?.value || 0,
      timestamp: latestPoint?.timestamp || Date.now()
    };
  });
  
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-bold mb-4">Memory Usage</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" tickFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()} />
            <YAxis />
            <Tooltip 
              labelFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()}
              formatter={(value) => [`${(value / (1024 * 1024)).toFixed(2)} MB`, 'Memory']}
            />
            <Legend />
            {Object.keys(timeSeriesData).map((containerId, idx) => (
              <Line 
                key={containerId}
                type="monotone"
                dataKey="memory"
                name={containerId}
                stroke={`hsl(${(idx * 60 + 180) % 360}, 70%, 50%)`}
                activeDot={{ r: 8 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Process Scheduling Timeline (Gantt Chart)
function SchedulingTimeline({ processData }) {
  // Group processes by container
  const containerProcesses = {};
  processData.forEach(process => {
    if (!containerProcesses[process.container_id]) {
      containerProcesses[process.container_id] = [];
    }
    containerProcesses[process.container_id].push(process);
  });
  
  // Calculate chart dimensions
  const containerCount = Object.keys(containerProcesses).length;
  const rowHeight = 30;
  const chartHeight = containerCount * rowHeight * 2; // 2 rows per container
  
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-bold mb-4">Process Scheduling Timeline</h2>
      <div style={{ height: `${Math.max(200, chartHeight)}px` }} className="overflow-auto">
        <svg width="100%" height={chartHeight}>
          {/* Horizontal container rows */}
          {Object.keys(containerProcesses).map((containerId, idx) => (
            <g key={containerId}>
              {/* Container label */}
              <text x="10" y={idx * rowHeight * 2 + 20} fill="#333" fontSize="12">
                {containerId}
              </text>
              
              {/* Process bars */}
              {containerProcesses[containerId].map((process, procIdx) => {
                const width = process.cpu_percent * 5; // Scale based on CPU %
                return (
                  <g key={`${process.pid}-${procIdx}`}>
                    <rect
                      x={100 + procIdx * 100}
                      y={idx * rowHeight * 2 + 10}
                      width={width}
                      height={rowHeight - 5}
                      fill={process.status === 'running' ? '#4ADE80' : '#FCD34D'}
                      stroke="#333"
                      strokeWidth="1"
                    />
                    <text
                      x={100 + procIdx * 100 + 5}
                      y={idx * rowHeight * 2 + 25}
                      fill="#333"
                      fontSize="10"
                    >
                      {process.name} ({process.pid})
                    </text>
                  </g>
                );
              })}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

// Main App component
export default function App() {
  const apiUrl = 'http://localhost:8000';
  const wsUrl = 'ws://localhost:8000/ws';
  
  const { data: wsData, isConnected } = useWebSocket(wsUrl);
  const [containers, setContainers] = useState([]);
  const [cpuTimeSeriesData, addCpuDataPoint] = useTimeSeriesData({}, 20);
  const [memTimeSeriesData, addMemDataPoint] = useTimeSeriesData({}, 20);
  const [schedulingData, setSchedulingData] = useState([]);
  
  // Update time series data when WebSocket data is received
  useEffect(() => {
    if (wsData && wsData.containers) {
      setContainers(wsData.containers);
      
      // Update CPU and memory time series
      wsData.containers.forEach(container => {
        addCpuDataPoint(container.id, container.cpu_percent, wsData.timestamp * 1000);
        addMemDataPoint(container.id, container.memory_usage, wsData.timestamp * 1000);
      });
    }
  }, [wsData]);
  
  // Fetch process scheduling data
  useEffect(() => {
    const fetchSchedulingData = async () => {
      try {
        const response = await fetch(`${apiUrl}/metrics/scheduling`);
        if (response.ok) {
          const data = await response.json();
          setSchedulingData(data.metrics || []);
        }
      } catch (error) {
        console.error('Failed to fetch scheduling metrics:', error);
      }
    };
    
    // Fetch initially and then every 2 seconds
    fetchSchedulingData();
    const interval = setInterval(fetchSchedulingData, 2000);
    
    return () => clearInterval(interval);
  }, [apiUrl]);
  
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">Mini-Docker Monitoring</h1>
            <div className={`ml-4 h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          </div>
          <div className="flex items-center">
            <Clock size={16} className="mr-2 text-gray-500" />
            <span className="text-sm text-gray-500">
              {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Container Overview</h2>
          <ContainerOverview containers={containers} />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <CPUUsageChart timeSeriesData={cpuTimeSeriesData} />
          <MemoryUsageChart timeSeriesData={memTimeSeriesData} />
        </div>
        
        <div className="mb-6">
          <SchedulingTimeline processData={schedulingData} />
        </div>
      </main>
    </div>
  );
}