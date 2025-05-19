import React, { useState } from 'react';
import { Box, Typography, Paper, Tabs, Tab, TextField, Button, Grid, Alert } from '@mui/material';
import useWebSocket from '../hooks/useWebSocket';
import SchedulingTimeline from '../components/SchedulingTimeline';

// Define the WebSocket URL with environment awareness
const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:8000/ws';

function Scheduler() {
  const [tabValue, setTabValue] = useState(0);
  const { data, isConnected, sendMessage } = useWebSocket(WEBSOCKET_URL);
  const [schedulerConfig, setSchedulerConfig] = useState({
    policy: 'fair',
    priority: 50,
    containerId: ''
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Mock scheduling data for the timeline
  const mockScheduleData = [
    { id: 'container1', label: 'Container 1', start: '2025-05-19T10:00:00', end: '2025-05-19T11:30:00' },
    { id: 'container2', label: 'Container 2', start: '2025-05-19T10:30:00', end: '2025-05-19T12:00:00' },
    { id: 'container3', label: 'Container 3', start: '2025-05-19T11:15:00', end: '2025-05-19T13:45:00' },
  ];

  const containerSchedules = data?.schedules || mockScheduleData;

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setSchedulerConfig({
      ...schedulerConfig,
      [name]: value
    });
  };

  const handleUpdatePolicy = () => {
    // Clear previous messages
    setSuccessMessage('');
    setErrorMessage('');

    if (!schedulerConfig.containerId) {
      setErrorMessage('Container ID is required');
      return;
    }

    // Convert policy string to number expected by backend
    const policyMap = {
      'fair': 0,
      'priority': 1,
      'realtime': 2
    };

    try {
      // Send update command to backend
      sendMessage({
        command: 'update_policy',
        container_id: schedulerConfig.containerId,
        policy: policyMap[schedulerConfig.policy] || 0,
        priority: parseInt(schedulerConfig.priority)
      });
      
      setSuccessMessage(`Successfully updated scheduling policy for container ${schedulerConfig.containerId}`);
    } catch (error) {
      setErrorMessage(`Failed to update policy: ${error.message}`);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Scheduler
      </Typography>
      
      {!isConnected && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          WebSocket disconnected. Some features may not work properly.
        </Alert>
      )}
      
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab label="Timeline" />
          <Tab label="Configuration" />
        </Tabs>
      </Paper>
      
      {tabValue === 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Container Scheduling Timeline
          </Typography>
          <Box sx={{ height: 400 }}>
            <SchedulingTimeline data={containerSchedules} width={800} height={350} />
          </Box>
        </Paper>
      )}
      
      {tabValue === 1 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Scheduler Configuration
          </Typography>
          
          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>
          )}
          
          {errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>
          )}
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Container ID"
                name="containerId"
                value={schedulerConfig.containerId}
                onChange={handleInputChange}
                margin="normal"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Scheduling Policy"
                name="policy"
                value={schedulerConfig.policy}
                onChange={handleInputChange}
                margin="normal"
                variant="outlined"
                SelectProps={{
                  native: true,
                }}
              >
                <option value="fair">Fair (Default)</option>
                <option value="priority">Priority-based</option>
                <option value="realtime">Realtime</option>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Priority (1-100)"
                name="priority"
                value={schedulerConfig.priority}
                onChange={handleInputChange}
                margin="normal"
                variant="outlined"
                inputProps={{ min: 1, max: 100 }}
              />
            </Grid>
            <Grid item xs={12}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleUpdatePolicy}
                disabled={!isConnected}
              >
                Update Policy
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
}

export default Scheduler;