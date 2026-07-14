import React from 'react';
import { Box, Grid, Card, CardContent, Typography, CardActionArea } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Landscape as PlotIcon, Apartment as FlatIcon } from '@mui/icons-material';
import ScreenHeader from '../../components/common/ScreenHeader';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import HomeIcon from '@mui/icons-material/Home';
import InventoryIcon from '@mui/icons-material/Inventory2';
import { usePageTitle } from '../../hooks';

const InventoryHub: React.FC = () => {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbs();

  React.useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Inventory Management', path: '/inventory', icon: <InventoryIcon fontSize="small" /> },
    ]);
  }, [setBreadcrumbs]);

  usePageTitle('Inventory Management');

  const menuItems = [
    {
      title: 'Plot Inventory',
      description: 'Manage plots and their status',
      icon: <PlotIcon sx={{ fontSize: 40 }} />,
      path: '/inventory/plots',
      color: '#2e7d32',
    },
    {
      title: 'Flat Inventory',
      description: 'Manage flats by tower, floor, and unit',
      icon: <FlatIcon sx={{ fontSize: 40 }} />,
      path: '/inventory/flats',
      color: '#1976d2',
    },
  ];

  return (
    <Box>
      <ScreenHeader title="Inventory Management" showAddButton={false} />

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

export default InventoryHub;