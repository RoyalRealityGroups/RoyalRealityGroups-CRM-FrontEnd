import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Divider,
} from '@mui/material';
import {
  Home as HomeIcon,
  PieChart as SourceIcon,
  People as EmployeeIcon,
  Business as ProjectIcon,
  LocationOn as SiteVisitIcon,
  BookOnline as BookingIcon,
  HowToReg as RegistrationIcon,
  TrendingUp as RevenueIcon,
} from '@mui/icons-material';
import ScreenHeader from '../../components/common/ScreenHeader';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { usePageTitle } from '../../hooks';

interface ReportCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  group: string;
}

const reportCards: ReportCard[] = [
  // Lead Reports
  {
    id: 'leads-source',
    title: 'Source Wise',
    description: 'Lead count grouped by source (Website, Facebook, Google Ads, etc.)',
    icon: <SourceIcon sx={{ fontSize: 36 }} />,
    color: '#1976d2',
    group: 'Lead Reports',
  },
  {
    id: 'leads-employee',
    title: 'Employee Wise',
    description: 'Lead distribution across assigned employees',
    icon: <EmployeeIcon sx={{ fontSize: 36 }} />,
    color: '#388e3c',
    group: 'Lead Reports',
  },
  {
    id: 'leads-project',
    title: 'Project Wise',
    description: 'Leads grouped by interested project',
    icon: <ProjectIcon sx={{ fontSize: 36 }} />,
    color: '#f57c00',
    group: 'Lead Reports',
  },
  // Site Visit Reports
  {
    id: 'site-visits',
    title: 'Site Visits',
    description: 'Daily, weekly, and monthly site visit summary',
    icon: <SiteVisitIcon sx={{ fontSize: 36 }} />,
    color: '#7b1fa2',
    group: 'Site Visit Reports',
  },
  // Sales Reports
  {
    id: 'bookings',
    title: 'Booking Reports',
    description: 'Project-wise booking count and revenue',
    icon: <BookingIcon sx={{ fontSize: 36 }} />,
    color: '#c62828',
    group: 'Sales Reports',
  },
  {
    id: 'registrations',
    title: 'Registration Reports',
    description: 'Completed registrations with revenue',
    icon: <RegistrationIcon sx={{ fontSize: 36 }} />,
    color: '#00838f',
    group: 'Sales Reports',
  },
  {
    id: 'revenue',
    title: 'Revenue Reports',
    description: 'Monthly revenue breakdown and collections',
    icon: <RevenueIcon sx={{ fontSize: 36 }} />,
    color: '#2e7d32',
    group: 'Sales Reports',
  },
];

const ReportsHub: React.FC = () => {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbs();
  usePageTitle('Reports');

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Reports' },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  // Group cards by section
  const groups = ['Lead Reports', 'Site Visit Reports', 'Sales Reports'];

  return (
    <Box sx={{ p: 2 }}>
      <ScreenHeader title="Reports" showAddButton={false} />

      {groups.map((group) => {
        const cards = reportCards.filter((c) => c.group === group);
        return (
          <Box key={group} sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1.5 }}>
              {group}
            </Typography>
            <Grid container spacing={2}>
              {cards.map((card) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={card.id}>
                  <Card
                    sx={{
                      height: '100%',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': { transform: 'translateY(-3px)', boxShadow: 4 },
                    }}
                  >
                    <CardActionArea
                      onClick={() => navigate(`/reports/${card.id}`)}
                      sx={{ height: '100%', p: 2 }}
                    >
                      <CardContent sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, p: 0 }}>
                        <Box
                          sx={{
                            bgcolor: card.color,
                            color: 'white',
                            borderRadius: 2,
                            p: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {card.icon}
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {card.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {card.description}
                          </Typography>
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
            {group !== 'Sales Reports' && <Divider sx={{ mt: 3 }} />}
          </Box>
        );
      })}
    </Box>
  );
};

export default ReportsHub;
