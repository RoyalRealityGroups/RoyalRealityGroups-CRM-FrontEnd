import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Paper,
  Avatar,
  Divider,
  Chip,
} from '@mui/material';
import type { SvgIconProps } from '@mui/material';
import {
  Assessment as AssessmentIcon,
  ReceiptLong as ReceiptLongIcon,
  GridView as GridViewIcon,
  Home as HomeIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  ArrowForward as ArrowForwardIcon,
  LocalShipping as LocalShippingIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { hasPermission } from '../utils/permissions';
import { useBreadcrumbs } from '../contexts/BreadcrumbContext';
import { usePageTitle } from '../hooks';
import {
  getPageContainerStyles,
  getHeaderSectionStyles,
  getContentSectionStyles,
} from '../utils/spacing';

type ViewMode = 'square' | 'rectangle' | 'list';

interface ReportItem {
  id: string;
  name: string;
  description: string;
  icon: React.ReactElement<SvgIconProps>;
  path: string;
  permission?: string;
}

const ReportsHub: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { setBreadcrumbs } = useBreadcrumbs();
  const [viewMode, setViewMode] = useState<ViewMode>('rectangle');

  usePageTitle('Reports');

  // Set breadcrumbs on mount
  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Reports' },
    ]);

    // Clear breadcrumbs on unmount
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  // Define all available reports with their required permissions
  const allReportItems: ReportItem[] = [
    {
      id: 'sales-order-report',
      name: 'Sales Order Report',
      description: 'Comprehensive sales order reporting with advanced filtering and export capabilities',
      icon: <ReceiptLongIcon sx={{ fontSize: 48 }} />,
      path: '/reports/orders',
      permission: 'view_salesorder',
    },
    {
      id: 'invoice-report',
      name: 'Invoice Report',
      description: 'Comprehensive invoice reporting with date filters, source type, dispatch number, and payment tracking',
      icon: <AssessmentIcon sx={{ fontSize: 48 }} />,
      path: '/reports/invoices',
      permission: 'view_invoice',
    },
    {
      id: 'dispatch-planning-report',
      name: 'Dispatch Planning Report',
      description: 'Product-wise dispatch planning report with location, route, and customer filters',
      icon: <LocalShippingIcon sx={{ fontSize: 48 }} />,
      path: '/reports/planning',
      permission: 'view_dispatchplan',
    },
    {
      id: 'receipts-report',
      name: 'Receipts Report',
      description: 'Receipt reporting with date filters, payment mode, customer type, invoice number, and company/location filters',
      icon: <AccountBalanceWalletIcon sx={{ fontSize: 48 }} />,
      path: '/reports/receipts',
      permission: 'view_receipt',
    },
    {  
      id: 'pod-report',
      name: 'Proof of Delivery Report',
      description: 'POD reporting with date presets, customer type, invoice number, and POD number filters',
      icon: <LocalShippingIcon sx={{ fontSize: 48 }} />,
      path: '/reports/pod',
      permission: 'view_proofofdelivery',
    },
    {
      id: 'real-estate-reports',
      name: 'Real Estate Reports',
      description: 'Analytics on leads by source, project booking status, revenue collections, and employee performance',
      icon: <AssessmentIcon sx={{ fontSize: 48 }} />,
      path: '/reports/real-estate',
      permission: 'view_reports',
    },
  ];

  // Filter reports based on user permissions
  const reportItems = allReportItems.filter(
    (report) => !report.permission || hasPermission(user, report.permission)
  );

  const handleCardClick = (path: string) => {
    navigate(path);
  };

  const handleViewModeChange = (_event: React.MouseEvent<HTMLElement>, newViewMode: ViewMode | null) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };

  // Render Square View
  const renderSquareView = () => (
    <Grid container spacing={3}>
      {reportItems.map((report) => (
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={report.id}>
          <Card
            sx={{
              height: '100%',
              transition: 'all 0.3s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6,
              },
            }}
          >
            <CardActionArea
              onClick={() => handleCardClick(report.path)}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 4,
              }}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <Box sx={{ color: 'primary.main', mb: 2 }}>
                  {report.icon}
                </Box>
                <Typography variant="h6" component="div" gutterBottom>
                  {report.name}
                </Typography>
                {report.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {report.description}
                  </Typography>
                )}
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  // Render Rectangle View
  const renderRectangleView = () => (
    <Grid container spacing={2}>
      {reportItems.map((report) => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={report.id}>
          <Card
            sx={{
              transition: 'all 0.3s',
              '&:hover': {
                transform: 'translateX(4px)',
                boxShadow: 4,
              },
            }}
          >
            <CardActionArea onClick={() => handleCardClick(report.path)}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: 'primary.main',
                    width: 56,
                    height: 56,
                  }}
                >
                  {React.cloneElement(report.icon, { sx: { fontSize: 32 } })}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" component="div">
                    {report.name}
                  </Typography>
                </Box>
                <ArrowForwardIcon color="action" />
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  // Render List View
  const renderListView = () => (
    <Paper elevation={1}>
      {reportItems.map((report, index) => (
        <React.Fragment key={report.id}>
          <CardActionArea
            onClick={() => handleCardClick(report.path)}
            sx={{
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, p: 2.5 }}>
              <Box
                sx={{
                  bgcolor: 'primary.main',
                  borderRadius: 2,
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Box sx={{ color: 'white' }}>
                  {React.cloneElement(report.icon, { sx: { fontSize: 40 } })}
                </Box>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" component="div" sx={{ mb: 0.5 }}>
                  {report.name}
                </Typography>
                {report.description && (
                  <Typography variant="body2" color="text.secondary">
                    {report.description}
                  </Typography>
                )}
              </Box>
              <Chip
                label="View"
                color="primary"
                variant="outlined"
                icon={<ArrowForwardIcon />}
                sx={{ px: 1 }}
              />
            </Box>
          </CardActionArea>
          {index < reportItems.length - 1 && <Divider />}
        </React.Fragment>
      ))}
    </Paper>
  );

  return (
    <Box sx={getPageContainerStyles()}>
      {/* Fixed Header */}
      <Box sx={getHeaderSectionStyles()}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          {/* Left: Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Reports
            </Typography>
          </Box>
          
          {/* Right: View Toggle */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            aria-label="view mode"
            size="small"
            sx={{
              '& .MuiToggleButton-root.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              },
            }}
          >
            <ToggleButton value="rectangle" aria-label="rectangle view">
              <ViewModuleIcon />
            </ToggleButton>
            <ToggleButton value="square" aria-label="square view">
              <GridViewIcon />
            </ToggleButton>
            <ToggleButton value="list" aria-label="list view">
              <ViewListIcon />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* Scrollable Content */}
      <Box sx={getContentSectionStyles()}>
        {/* Reports Content */}
        {reportItems.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              No reports available
            </Typography>
          </Box>
        ) : (
          <>
            {viewMode === 'square' && renderSquareView()}
            {viewMode === 'rectangle' && renderRectangleView()}
            {viewMode === 'list' && renderListView()}
          </>
        )}
      </Box>
    </Box>
  );
};

export default ReportsHub;
