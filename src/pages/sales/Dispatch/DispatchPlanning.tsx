import React, { useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
} from '@mui/material';
import {
  LocalShipping as LocalShippingIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ScreenHeader from '../../../components/common/ScreenHeader';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import HomeIcon from '@mui/icons-material/Home';
import FolderIcon from '@mui/icons-material/Folder';
import {
  getPageContainerStyles,
  getHeaderSectionStyles,
  getContentSectionStyles,
} from '../../../utils/spacing';

const DispatchPlanning: React.FC = () => {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Sales', path: '/sales', icon: <FolderIcon fontSize="small" /> },
      { label: 'Dispatch Planning', icon: <LocalShippingIcon fontSize="small" /> },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  return (
    <Box sx={getPageContainerStyles()}>
      <Box sx={getHeaderSectionStyles()}>
        <ScreenHeader
          title="Dispatch Planning"
          showBackButton={true}
          onBack={() => navigate('/sales')}
          disableBox
        />
      </Box>

      <Box sx={getContentSectionStyles()}>
        <Card>
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 8,
                gap: 2,
              }}
            >
              <LocalShippingIcon sx={{ fontSize: 80, color: 'primary.main' }} />
              <Typography variant="h4" gutterBottom>
                Dispatch Planning
              </Typography>
              <Typography variant="body1" color="text.secondary" align="center">
                Plan and manage order dispatch. This module will allow you to:
              </Typography>
              <Box sx={{ mt: 2, textAlign: 'left' }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  • Schedule deliveries based on approved orders
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  • Assign vehicles and delivery personnel
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  • Optimize delivery routes
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  • Track dispatch status in real-time
                </Typography>
              </Box>
              <Typography
                variant="body2"
                color="warning.main"
                sx={{ mt: 3, fontStyle: 'italic' }}
              >
                Coming Soon - Module Under Development
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default DispatchPlanning;
