import React, { useState, useEffect } from 'react';
import { Grid, Typography, Box, Alert } from '@mui/material';
import ResourceUsage from '../components/ResourceUsage';
import SchedulingTimeline from '../components/SchedulingTimeline';
import ProcessTreeChart from '../components/ProcessTreeChart';
import useWebSocket from '../hooks/useWebSocket';

const Dashboard = () => {
  const [stats, setStats] = useState({
    containers: [],
    timestamp: Date.now()
  });
  const [error, setError] = useState(null);

  const { ws, isConnected } = useWebSocket('ws://localhost:8000/ws');

  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setStats(data);
        setError(null);
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
        setError('Error processing server data');
      }
    };

    const handleError = (error) => {
      console.error('WebSocket error:', error);
      setError('Connection error. Attempting to reconnect...');
    };

    ws.addEventListener('message', handleMessage);
    ws.addEventListener('error', handleError);

    return () => {
      ws.removeEventListener('message', handleMessage);
      ws.removeEventListener('error', handleError);
    };
  }, [ws]);

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      {!isConnected && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Connecting to server...
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <ResourceUsage stats={stats} />
        </Grid>
        <Grid item xs={12} md={6}>
          <SchedulingTimeline stats={stats} />
        </Grid>
        <Grid item xs={12} md={6}>
          <ProcessTreeChart data={stats} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 