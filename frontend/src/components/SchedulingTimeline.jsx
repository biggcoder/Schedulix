import React from 'react';
import { Box } from '@mui/material';
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot } from '@mui/lab';

const SchedulingTimeline = ({ stats }) => {
  return (
    <Box sx={{ height: 300, overflow: 'auto' }}>
      <Timeline>
        {stats.containers.map((container, index) => (
          <TimelineItem key={container.id || index}>
            <TimelineSeparator>
              <TimelineDot color={container.status === 'running' ? 'primary' : 'grey'} />
              {index < stats.containers.length - 1 && <TimelineConnector />}
            </TimelineSeparator>
            <TimelineContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{container.name || `Container ${index + 1}`}</span>
                <span>CPU: {container.cpu_percent?.toFixed(1)}%</span>
              </Box>
              {container.scheduling_info && (
                <Box sx={{ mt: 1, fontSize: '0.875rem', color: 'text.secondary' }}>
                  <div>Policy: {container.scheduling_info.policy}</div>
                  <div>Priority: {container.scheduling_info.priority}</div>
                </Box>
              )}
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    </Box>
  );
};

export default SchedulingTimeline; 