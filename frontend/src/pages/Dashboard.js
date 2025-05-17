import React from 'react';
import { Typography, Box } from '@mui/material';
import useWebSocket from '../hooks/useWebSocket';
import ProcessTree from '../components/ProcessTree';
import ResourceMonitor from '../components/ResourceMonitor';

const WEBSOCKET_URL = 'ws://localhost:8000/ws'; // Replace with your backend WebSocket URL

function Dashboard() {
  const { data } = useWebSocket(WEBSOCKET_URL);
  const containerData = data?.containers || [];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Box sx={{ mt: 3 }}>
        <Typography variant="h5" gutterBottom>
          Container Processes
        </Typography>
        {/* Pass container data or a specific container's process data */}
        {containerData.map((container) => (
          <Box key={container.id} sx={{ mb: 4 }}>
            <Typography variant="h6">{container.name}</Typography>
            <ProcessTree data={container.processes} />
            <ResourceMonitor data={container} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default Dashboard;