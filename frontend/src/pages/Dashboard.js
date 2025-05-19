import React from 'react';
import { Typography, Box, CircularProgress, Alert } from '@mui/material';
import ProcessTree from '../components/ProcessTree';
import ResourceMonitor from '../components/ResourceMonitor';

// Create a mock version of useWebSocket hook if it's not available
const useWebSocketMock = (url) => {
  return {
    data: null,
    isConnected: false,
    sendMessage: () => console.log('Mock sendMessage called')
  };
};

// Try to import the real hook but fallback to mock if not available
const useWebSocket = (url) => {
  try {
    // This is a runtime check that won't affect compilation
    const realHook = require('../hooks/useWebSocket').default;
    return realHook(url);
  } catch (error) {
    console.warn('useWebSocket hook not available, using mock');
    return useWebSocketMock(url);
  }
};

const WEBSOCKET_URL = 'ws://localhost:8000/ws'; // Replace with your backend WebSocket URL

function Dashboard() {
  const { data, isConnected } = useWebSocket(WEBSOCKET_URL);
  const containerData = data?.containers || [];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {!isConnected && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Not connected to WebSocket server. Attempting to connect...
        </Alert>
      )}

      {isConnected && containerData.length === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Waiting for container data...
          </Typography>
        </Box>
      )}

      {containerData.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" gutterBottom>
            Container Processes
          </Typography>
          {containerData.map((container) => (
            <Box key={container.id || Math.random()} sx={{ mb: 4 }}>
              <Typography variant="h6">{container.name || 'Unnamed Container'}</Typography>
              {container.processes && <ProcessTree data={container.processes} />}
              <ResourceMonitor data={container.resources || []} />
            </Box>
          ))}
        </Box>
      )}

      {/* Display fallback content when no data is available */}
      {!data && isConnected && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" gutterBottom>
            No Data Available
          </Typography>
          <Typography variant="body1">
            Connected, but no container data has been received. Check your WebSocket server.
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default Dashboard;