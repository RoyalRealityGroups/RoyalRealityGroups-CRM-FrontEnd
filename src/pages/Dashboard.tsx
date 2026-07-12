import React, { useEffect, useState } from 'react';
import { Box, Typography, Container, Alert, CircularProgress } from '@mui/material';
import { useAppSelector } from '../store/hooks';
import { useBreadcrumbs } from '../contexts/BreadcrumbContext';
import { usePageTitle } from '../hooks';
import { getHubContainerStyles } from '../utils/spacing';
// import { DashboardRenderer } from './dashboards';
import { dashboardsApi } from '../api/dashboards.api';

const Dashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { setBreadcrumbs } = useBreadcrumbs();
  const [dashboardId, setDashboardId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  usePageTitle('Dashboard');

  useEffect(() => {
    setBreadcrumbs([]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  // Load default dashboard
  useEffect(() => {
    const loadDefaultDashboard = async () => {
      try {
        const response = await dashboardsApi.getDefault();
        if (response.success && response.data?.id) {
          setDashboardId(response.data.id);
        } else {
          setError('No default dashboard configured');
        }
      } catch (err) {
        setError('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDefaultDashboard();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="xl" sx={getHubContainerStyles()}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !dashboardId) {
    return (
      <Container maxWidth="xl" sx={getHubContainerStyles()}>
        <Typography variant="h4" fontWeight={600} gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' } }}>
          Dashboard
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          Welcome, {user?.first_name || user?.username}!
        </Typography>
        <Alert severity="info">{error || 'No dashboard available'}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={getHubContainerStyles()}>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Welcome, {user?.first_name || user?.username}!
      </Typography>

      {/* <DashboardRenderer dashboardId={dashboardId} /> */}
    </Container>
  );
};

export default Dashboard;
