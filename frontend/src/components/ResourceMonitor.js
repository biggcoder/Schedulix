import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, Typography, Box } from '@mui/material';

const ResourceMonitor = ({ data }) => {
  // Handle undefined, null, or empty array data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Resource Usage
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No resource data available.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Resource Usage
        </Typography>
        <Box sx={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="cpu" 
                stroke="#8884d8" 
                name="CPU Usage (%)" 
                isAnimationActive={false}
              />
              <Line 
                type="monotone" 
                dataKey="memory" 
                stroke="#82ca9d" 
                name="Memory Usage (MB)" 
                isAnimationActive={false}
              />
              <Line 
                type="monotone" 
                dataKey="network" 
                stroke="#ffc658" 
                name="Network Usage (KB/s)" 
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ResourceMonitor;