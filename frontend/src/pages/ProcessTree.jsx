import React from 'react';
import { Box, Typography } from '@mui/material';
import { Tree, TreeNode } from 'react-organizational-chart';

const ProcessTree = ({ stats }) => {
  const renderProcessNode = (process) => (
    <TreeNode label={
      <Box sx={{ p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Typography variant="subtitle2">{process.name}</Typography>
        <Typography variant="caption" display="block">
          PID: {process.pid}
        </Typography>
        <Typography variant="caption" display="block">
          CPU: {process.cpu_percent?.toFixed(1)}%
        </Typography>
      </Box>
    }>
      {process.children?.map(child => renderProcessNode(child))}
    </TreeNode>
  );

  return (
    <Box sx={{ height: 300, overflow: 'auto' }}>
      {stats.containers.map((container, index) => (
        <Box key={container.id || index} sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            {container.name || `Container ${index + 1}`}
          </Typography>
          <Tree
            lineWidth="2px"
            lineColor="#bdbdbd"
            lineBorderRadius="10px"
            label={
              <Box sx={{ p: 1, bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: 1 }}>
                <Typography variant="subtitle2">
                  {container.name || `Container ${index + 1}`}
                </Typography>
                <Typography variant="caption" display="block">
                  CPU: {container.cpu_percent?.toFixed(1)}%
                </Typography>
              </Box>
            }
          >
            {container.processes?.map(process => renderProcessNode(process))}
          </Tree>
        </Box>
      ))}
    </Box>
  );
};

export default ProcessTree; 