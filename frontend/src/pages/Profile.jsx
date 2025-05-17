import React from 'react';
import { Grid, Paper, Typography, Avatar, Box, Button } from '@mui/material';

const Profile = () => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4" gutterBottom>
          Profile
        </Typography>
      </Grid>

      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Avatar
            sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
            src="/avatar.jpg"
          />
          <Typography variant="h6" gutterBottom>
            John Doe
          </Typography>
          <Typography color="textSecondary" gutterBottom>
            System Administrator
          </Typography>
          <Button variant="outlined" sx={{ mt: 2 }}>
            Change Avatar
          </Button>
        </Paper>
      </Grid>

      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Account Information
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" color="textSecondary">
                Email
              </Typography>
              <Typography>john.doe@example.com</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="textSecondary">
                Role
              </Typography>
              <Typography>Administrator</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="textSecondary">
                Last Login
              </Typography>
              <Typography>2024-02-20 09:45:23</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="textSecondary">
                Account Created
              </Typography>
              <Typography>2024-01-01</Typography>
            </Box>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Profile; 