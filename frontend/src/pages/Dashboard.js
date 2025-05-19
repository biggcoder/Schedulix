import React from 'react';
import { Typography, Box, Grid, Paper } from '@mui/material';
import useWebSocket from '../hooks/useWebSocket';
import ProcessTree from '../components/ProcessTree';
import ResourceMonitor from '../components/ResourceMonitor';

// Define the WebSocket URL with environment awareness
const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:8000/ws';

function Dashboard() {
  const { data, isConnected } = useWebSocket(WEBSOCKET_URL);
  const containerData = data?.containers || [];

  // Transform data for ResourceMonitor component
  const prepareResourceData = (container) => {
    if (!container) return [];
    
    // Create a data point with the current timestamp
    return [
      {
        timestamp: new Date().toLocaleTimeString(),
        cpu: container.cpu_percent || 0,
        memory: ((container.memory_usage || 0) / (1024 * 1024)).toFixed(2), // Convert to MB
        network: Math.random() * 100 // Mock data for network since it's not provided
      }
    ];
  };

  // Transform data for ProcessTree visualization
  const prepareProcessTreeData = (processes) => {
    if (!processes || processes.length === 0) return null;
    
    // Find likely root process (usually the first one)
    const rootProcess = processes[0];
    
    // Create a hierarchical structure
    const rootNode = {
      name: rootProcess.name || 'root',
      pid: rootProcess.pid,
      children: []
    };
    
    // Add child processes
    for (let i = 1; i < processes.length; i++) {
      rootNode.children.push({
        name: processes[i].name || `process-${processes[i].pid}`,
        pid: processes[i].pid
      });
    }
    
    return rootNode;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      {!isConnected && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'error.dark' }}>
          <Typography variant="body1">
            WebSocket disconnected. Trying to reconnect...
          </Typography>
        </Paper>
      )}
      
      {containerData.length === 0 ? (
        <Typography variant="body1">No container data available</Typography>
      ) : (
        containerData.map((container) => (
          <Paper key={container.id} sx={{ p: 2, mb: 4 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h5">{container.name}</Typography>
              <Typography variant="body2">ID: {container.id}</Typography>
              <Typography variant="body2">Status: {container.status || 'Unknown'}</Typography>
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Process Tree</Typography>
                <Box sx={{ height: 400, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 1 }}>
                  <ProcessTree data={prepareProcessTreeData(container.processes)} />
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <ResourceMonitor data={prepareResourceData(container)} />
              </Grid>
            </Grid>
          </Paper>
        ))
      )}
    </Box>
  );
}

export default Dashboard;