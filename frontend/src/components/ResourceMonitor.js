import React, { useState, useEffect } from 'react';
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
import { Card, CardContent, Typography, Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

// Maximum number of data points to keep in history
const MAX_DATA_POINTS = 20;

const ResourceMonitor = ({ data }) => {
  // State to store historical data
  const [historicalData, setHistoricalData] = useState([]);
  // Selected metric for detailed view
  const [selectedMetric, setSelectedMetric] = useState('all');

  // Update historical data when new data arrives
  useEffect(() => {
    if (!data || data.length === 0) return;
    
    setHistoricalData(prevData => {
      // Add timestamp if not present
      const newData = data.map(item => ({
        ...item,
        timestamp: item.timestamp || new Date().toLocaleTimeString()
      }));
      
      // Combine with previous data and limit to max points
      const combined = [...prevData, ...newData];
      return combined.slice(-MAX_DATA_POINTS);
    });
  }, [data]);

  if (historicalData.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Resource Usage
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No resource data available. Waiting for data...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Handle metric selection change
  const handleMetricChange = (event) => {
    setSelectedMetric(event.target.value);
  };

  // Determine which lines to display based on selection
  const showCpu = selectedMetric === 'all' || selectedMetric === 'cpu';
  const showMemory = selectedMetric === 'all' || selectedMetric === 'memory';
  const showNetwork = selectedMetric === 'all' || selectedMetric === 'network';

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Resource Usage
          </Typography>
          <FormControl size="small" sx={{ width: 120 }}>
            <InputLabel id="metric-select-label">Metric</InputLabel>
            <Select
              labelId="metric-select-label"
              id="metric-select"
              value={selectedMetric}
              label="Metric"
              onChange={handleMetricChange}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="cpu">CPU</MenuItem>
              <MenuItem value="memory">Memory</MenuItem>
              <MenuItem value="network">Network</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="timestamp" 
                tick={{ fill: '#eee' }}
                tickFormatter={(value) => {
                  // Show shorter timestamp if needed
                  return value.split(' ')[0]; // Show only time part
                }}
              />
              <YAxis tick={{ fill: '#eee' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#333',
                  border: '1px solid #555',
                  borderRadius: '4px'
                }}
              />
              <Legend />
              {showCpu && (
                <Line 
                  type="monotone" 
                  dataKey="cpu" 
                  stroke="#8884d8" 
                  name="CPU Usage (%)" 
                  dot={false}
                  isAnimationActive={false}
                />
              )}
              {showMemory && (
                <Line 
                  type="monotone" 
                  dataKey="memory" 
                  stroke="#82ca9d" 
                  name="Memory Usage (MB)" 
                  dot={false}
                  isAnimationActive={false}
                />
              )}
              {showNetwork && (
                <Line 
                  type="monotone" 
                  dataKey="network" 
                  stroke="#ffc658" 
                  name="Network Usage (KB/s)" 
                  dot={false}
                  isAnimationActive={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ResourceMonitor;