import React from 'react';
import { Grid, Typography, Box } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const ResourceUsage = ({ stats }) => {
  // Calculate total resource usage
  const totalCpu = stats.containers.reduce((sum, container) => sum + (container.cpu_percent || 0), 0);
  const totalMemory = stats.containers.reduce((sum, container) => sum + (container.memory_usage || 0), 0);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            CPU Usage
          </Typography>
          <Typography variant="h4" color="primary">
            {totalCpu.toFixed(1)}%
          </Typography>
        </Box>
      </Grid>
      <Grid item xs={12} md={6}>
        <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            Memory Usage
          </Typography>
          <Typography variant="h4" color="primary">
            {(totalMemory / 1024 / 1024).toFixed(2)} MB
          </Typography>
        </Box>
      </Grid>
      <Grid item xs={12}>
        <Box sx={{ height: 300 }}>
          <LineChart
            width={800}
            height={300}
            data={stats.containers}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="cpu_percent" stroke="#8884d8" name="CPU %" />
            <Line type="monotone" dataKey="memory_usage" stroke="#82ca9d" name="Memory (bytes)" />
          </LineChart>
        </Box>
      </Grid>
    </Grid>
  );
};

export default ResourceUsage; 