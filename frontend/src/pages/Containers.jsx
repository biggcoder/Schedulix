import React from 'react';
import { Grid, Paper, Typography, Button, Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

const Containers = () => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4">Containers</Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
          >
            New Container
          </Button>
        </Box>
      </Grid>
      
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Running Containers
          </Typography>
          {/* Container list will go here */}
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Containers; 