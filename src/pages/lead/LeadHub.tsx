import React from 'react';
import { Box, Grid, Card, CardContent, Typography, CardActionArea } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Person as LeadIcon,
  Add as AddIcon,
  FollowTheSigns as FollowUpIcon,
} from '@mui/icons-material';
import ScreenHeader from '../../components/common/ScreenHeader';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import HomeIcon from '@mui/icons-material/Home';
import { usePageTitle } from '../../hooks';

const LeadHub: React.FC = () => {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbs();

  React.useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Lead Management', path: '/lead', icon: <LeadIcon fontSize="small" /> },
    ]);
  }, [setBreadcrumbs]);

  usePageTitle('Lead Management');

  const menuItems = [
    {
      title: 'Lead List',
      description: 'View and manage all leads',
      icon: <LeadIcon sx={{ fontSize: 40 }} />,
      path: '/lead/list',
      color: '#1976d2',
    },
    {
      title: 'Follow-ups',
      description: 'Track due and overdue follow-ups',
      icon: <FollowUpIcon sx={{ fontSize: 40 }} />,
      path: '/lead/follow-ups',
      color: '#2e7d32',
    },
    {
      title: 'Add New Lead',
      description: 'Create a new lead entry',
      icon: <AddIcon sx={{ fontSize: 40 }} />,
      path: '/lead/add',
      color: '#9c27b0',
    },
  ];

  return (
    <Box>
      <ScreenHeader title="Lead Management" showAddButton={false} />

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {menuItems.map((item) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.path}>
            <Card
              sx={{
                height: '100%',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 },
              }}
            >
              <CardActionArea onClick={() => navigate(item.path)} sx={{ height: '100%' }}>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <Box sx={{ color: item.color, mb: 2 }}>{item.icon}</Box>
                  <Typography variant="h6" gutterBottom>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default LeadHub;
