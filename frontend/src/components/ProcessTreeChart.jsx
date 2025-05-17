import React, { useEffect, useRef } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { OrgChart } from 'd3-org-chart';

const ProcessTreeChart = ({ data }) => {
  const chartRef = useRef(null);
  const orgChartRef = useRef(null);

  useEffect(() => {
    if (!data || !chartRef.current) return;

    // Initialize the chart if it hasn't been initialized yet
    if (!orgChartRef.current) {
      orgChartRef.current = OrgChart()
        .container(chartRef.current)
        .nodeWidth(d => 200)
        .nodeHeight(d => 100)
        .childrenMargin(d => 50)
        .compactMarginBetween(d => 25)
        .compactMarginPair(d => 30)
        .nodeContent((d, i, arr, state) => {
          return `
            <div style="border-radius: 3px; padding: 5px; background-color: ${d.data.status === 'running' ? '#4caf50' : '#f44336'}; color: white;">
              <div style="font-weight: bold;">${d.data.name}</div>
              <div>CPU: ${d.data.cpu_percent.toFixed(1)}%</div>
              <div>Memory: ${(d.data.memory_usage / (1024 * 1024)).toFixed(1)} MB</div>
            </div>
          `;
        });
    }

    // Transform the data into the format expected by d3-org-chart
    const transformedData = {
      id: 'root',
      name: 'System',
      children: data.containers.map(container => ({
        id: container.id,
        name: container.name,
        cpu_percent: container.cpu_percent,
        memory_usage: container.memory_usage,
        status: container.status,
        children: container.processes.map(process => ({
          id: `${container.id}-${process.pid}`,
          name: process.name,
          cpu_percent: process.cpu_percent,
          memory_usage: process.memory_percent,
          status: 'running'
        }))
      }))
    };

    // Update the chart with new data
    orgChartRef.current
      .setData(transformedData)
      .render();

  }, [data]);

  return (
    <Paper elevation={3} sx={{ p: 2, height: '100%', minHeight: '500px' }}>
      <Typography variant="h6" gutterBottom>
        Process Tree
      </Typography>
      <Box
        ref={chartRef}
        sx={{
          width: '100%',
          height: 'calc(100% - 40px)',
          overflow: 'auto'
        }}
      />
    </Paper>
  );
};

export default ProcessTreeChart; 