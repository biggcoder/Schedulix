import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';

const Logs = () => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4" gutterBottom>
          System Logs
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <Paper sx={{ p: 2, height: 'calc(100vh - 200px)', overflow: 'auto' }}>
          <Box sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
            {`[2024-02-20 10:00:00] INFO: System started
[2024-02-20 10:00:01] INFO: Loading configuration
[2024-02-20 10:00:02] INFO: Initializing scheduler
[2024-02-20 10:00:03] INFO: Starting container manager
[2024-02-20 10:00:04] INFO: Monitoring system initialized
[2024-02-20 10:00:05] INFO: WebSocket server started
[2024-02-20 10:00:06] INFO: API server started on port 8000
[2024-02-20 10:00:07] INFO: Frontend server started on port 3000
[2024-02-20 10:00:08] INFO: System ready for connections
[2024-02-20 10:00:09] INFO: First client connected
[2024-02-20 10:00:10] INFO: Container 'app-1' started
[2024-02-20 10:00:11] INFO: Container 'app-2' started
[2024-02-20 10:00:12] INFO: Scheduler task completed
[2024-02-20 10:00:13] INFO: Resource allocation updated
[2024-02-20 10:00:14] INFO: Performance metrics collected
[2024-02-20 10:00:15] INFO: System health check passed`}
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Logs; 