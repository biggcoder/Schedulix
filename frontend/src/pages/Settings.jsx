import React from 'react';
import { Grid, Paper, Typography, Switch, FormControlLabel, Box } from '@mui/material';

const Settings = () => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4" gutterBottom>
          Settings
        </Typography>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            General Settings
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Enable Real-time Updates"
            />
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Show GPU Statistics"
            />
            <FormControlLabel
              control={<Switch />}
              label="Dark Mode"
            />
          </Box>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Scheduler Settings
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Enable Priority Scheduling"
            />
            <FormControlLabel
              control={<Switch />}
              label="Enable GPU Scheduling"
            />
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Auto-scaling"
            />
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Settings; 