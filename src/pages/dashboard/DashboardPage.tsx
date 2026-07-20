/**
 * Module 12 - Dashboard
 *
 * Director Dashboard: Total Leads, Today's Leads, Site Visits, Bookings,
 *   Registrations, Revenue, Employee Performance, Project Performance
 *
 * Team Leader Dashboard: Team Leads, Site Visits, Bookings,
 *   Registrations, Performance Summary
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import {
  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import {
  People as LeadsIcon,
  Today as TodayIcon,
  LocationOn as SiteVisitIcon,
  BookOnline as BookingIcon,
  HowToReg as RegistrationIcon,
  TrendingUp as RevenueIcon,
  Person as EmployeeIcon,
  Business as ProjectIcon,
} from '@mui/icons-material';
import { reReportsApi } from '../../api/reReports';
import { usePageTitle } from '../../hooks';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}

const StatCard = ({ title, value, icon, color, onClick }: StatCardProps) => (
  <Paper
    onClick={onClick}
    sx={{
      p: 2.5,
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      cursor: onClick ? 'pointer' : 'default',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': onClick ? { transform: 'translateY(-2px)', boxShadow: 3 } : {},
    }}
  >
    <Box
      sx={{
        width: 48,
        height: 48,
        borderRadius: 2,
        bgcolor: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        flexShrink: 0,
      }}
    >
      {icon}
    </Box>
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {title}
      </Typography>
    </Box>
  </Paper>
);

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { setBreadcrumbs } = useBreadcrumbs();
  usePageTitle('Dashboard');

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setBreadcrumbs([]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await reReportsApi.getDashboardSummary();
        setData(response);
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Welcome */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {getGreeting()}, {user?.first_name || user?.username}!
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Here's your overview for today
        </Typography>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Leads"
            value={data?.leads?.total || 0}
            icon={<LeadsIcon />}
            color="#1976d2"
            onClick={() => navigate('/lead/list')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Today's Leads"
            value={data?.leads?.today || 0}
            icon={<TodayIcon />}
            color="#0288d1"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Site Visits"
            value={data?.site_visits?.total || 0}
            icon={<SiteVisitIcon />}
            color="#7b1fa2"
            onClick={() => navigate('/sitevisit/list')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Bookings"
            value={data?.bookings?.total || 0}
            icon={<BookingIcon />}
            color="#388e3c"
            onClick={() => navigate('/booking')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Registrations"
            value={data?.registrations?.total || 0}
            icon={<RegistrationIcon />}
            color="#00838f"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Revenue"
            value={`₹${Number(data?.revenue?.total || 0).toLocaleString('en-IN')}`}
            icon={<RevenueIcon />}
            color="#2e7d32"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="This Month Revenue"
            value={`₹${Number(data?.revenue?.this_month || 0).toLocaleString('en-IN')}`}
            icon={<RevenueIcon />}
            color="#f57c00"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Bookings This Month"
            value={data?.bookings?.this_month || 0}
            icon={<BookingIcon />}
            color="#c62828"
          />
        </Grid>
      </Grid>

      {/* Employee Performance + Project Performance Tables */}
      <Grid container spacing={3}>
        {/* Employee Performance */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Employee Performance
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Leads</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Visits</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Bookings</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Registrations</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(data?.employee_performance || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body2" color="text.secondary">No data</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    (data?.employee_performance || []).map((emp: any) => (
                      <TableRow key={emp.employee_id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{emp.employee_name}</Typography>
                            {emp.designation && (
                              <Typography variant="caption" color="text.secondary">{emp.designation}</Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="center">{emp.leads}</TableCell>
                        <TableCell align="center">{emp.site_visits}</TableCell>
                        <TableCell align="center">{emp.bookings}</TableCell>
                        <TableCell align="center">{emp.registrations}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Project Performance */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Project Performance
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Project</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Bookings</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Registrations</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Revenue</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(data?.project_performance || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography variant="body2" color="text.secondary">No data</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    (data?.project_performance || []).map((proj: any) => (
                      <TableRow key={proj.project_id}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{proj.project_name}</Typography>
                        </TableCell>
                        <TableCell align="center">{proj.bookings}</TableCell>
                        <TableCell align="center">{proj.registrations}</TableCell>
                        <TableCell align="right">₹{Number(proj.revenue || 0).toLocaleString('en-IN')}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
