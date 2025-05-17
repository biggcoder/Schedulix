import React from 'react';
import { Tree, TreeNode } from 'react-organizational-chart';
import { Paper, Typography, Box } from '@mui/material';

const ProcessNode = ({ process }) => (
  <Box sx={{ p: 1, border: '1px solid #ccc', borderRadius: 1 }}>
    <Typography variant="subtitle2">{process.name}</Typography>
    <Typography variant="caption">PID: {process.pid}</Typography>
    <Typography variant="caption" display="block">
      CPU: {process.cpu_percent.toFixed(1)}%
    </Typography>
    <Typography variant="caption" display="block">
      Memory: {process.memory_percent.toFixed(1)}%
    </Typography>
  </Box>
);

const ProcessTree = ({ stats }) => {
  const renderProcessTree = (processes) => {
    if (!processes || processes.length === 0) {
      return null;
    }

    return processes.map((process) => (
      <TreeNode key={process.pid} label={<ProcessNode process={process} />}>
        {process.children && renderProcessTree(process.children)}
      </TreeNode>
    ));
  };

  return (
    <Box sx={{ overflow: 'auto', maxHeight: 400 }}>
      <Tree
        lineWidth="2px"
        lineColor="#ccc"
        lineBorderRadius="10px"
        label={<Typography variant="h6">Container Processes</Typography>}
      >
        {stats.containers?.map((container) => (
          <TreeNode
            key={container.id}
            label={
              <Box sx={{ p: 1, border: '1px solid #ccc', borderRadius: 1 }}>
                <Typography variant="subtitle1">{container.id}</Typography>
                <Typography variant="caption">
                  CPU: {container.cpu_percent.toFixed(1)}%
                </Typography>
                <Typography variant="caption" display="block">
                  Memory: {container.memory_usage}MB
                </Typography>
              </Box>
            }
          >
            {renderProcessTree(container.processes)}
          </TreeNode>
        ))}
      </Tree>
    </Box>
  );
};

export default ProcessTree; 