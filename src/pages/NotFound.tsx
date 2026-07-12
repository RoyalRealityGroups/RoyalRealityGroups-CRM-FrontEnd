import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../utils/constants';
import { usePageTitle } from '../hooks';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  usePageTitle('Page Not Found');

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        textAlign: 'center',
        padding: 3,
      }}
    >
      <Typography variant="h1" fontWeight={700} color="primary">
        404
      </Typography>
      <Typography variant="h5" gutterBottom>
        Page Not Found
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        The page you are looking for does not exist.
      </Typography>
      <Button
        variant="contained"
        onClick={() => navigate(ROUTES.DASHBOARD)}
      >
        Go to Dashboard
      </Button>
    </Box>
  );
};

export default NotFound;
