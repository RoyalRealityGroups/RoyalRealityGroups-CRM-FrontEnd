/**
 * Module 12 - Dashboard
 *
 * Director Dashboard: Total Leads, Today's Leads, Site Visits, Bookings,
 *   Registrations, Revenue, Employee Performance, Project Performance
 *
 * With charts: Lead Pipeline (Pie), Revenue Trend (Bar), Site Visit Status (Donut)
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
} from '@mui/material';
import {
  People as LeadsIcon,
  Today as TodayIcon,
  LocationOn as SiteVisitIcon,
  BookOnline as BookingIcon,
  HowToReg as RegistrationIcon,
  TrendingUp as RevenueIcon,
} from '@mui/icons-material';
import { reReportsApi } from '../../api/reReports';
import { usePageTitle } from '../../hooks';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { PieChartCard, AnimatedBarChartCard, AnimatedLineChartCard } from '../../components/ui/ChartJS';

// ---------- Stat Card ----------
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
        width: 48, height: 48, borderRadius: 2, bgcolor: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', flexShrink: 0,
      }}
    >
      {icon}
    </Box>
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{value}</Typography>
      <Typography variant="body2" color="text.secondary">{title}</Typography>
    </Box>
  </Paper>
);

// ---------- Main Component ----------
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

  // Chart data
  const siteVisitChartData = [
    { name: 'Completed', value: data?.site_visits?.completed || 0, color: '#4caf50' },
    { name: 'Scheduled', value: data?.site_visits?.scheduled || 0, color: '#2196f3' },
  ];

  const leadPipelineData = (data?.lead_pipeline || []).map((item: any, index: number) => ({
    name: item.status?.replace(/_/g, ' ') || 'Unknown',
    value: item.count || 0,
  }));

  const projectChartData = (data?.project_performance || []).map((p: any) => ({
    name: p.project_name,
    Bookings: p.bookings,
    Registrations: p.registrations,
  }));

  const employeeChartData = (data?.employee_performance || []).slice(0, 5).map((e: any) => ({
    name: e.employee_name?.split(' ')[0] || 'Emp',
    Leads: e.leads,
    'Site Visits': e.site_visits,
    Bookings: e.bookings,
  }));

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, overflow: 'auto', height: '100%' }}>
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
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Leads" value={data?.leads?.total || 0} icon={<LeadsIcon />} color="#1976d2" onClick={() => navigate('/lead/list')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Today's Leads" value={data?.leads?.today || 0} icon={<TodayIcon />} color="#0288d1" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Site Visits" value={data?.site_visits?.total || 0} icon={<SiteVisitIcon />} color="#7b1fa2" onClick={() => navigate('/sitevisit/list')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Bookings" value={data?.bookings?.total || 0} icon={<BookingIcon />} color="#388e3c" onClick={() => navigate('/booking')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Registrations" value={data?.registrations?.total || 0} icon={<RegistrationIcon />} color="#00838f" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Revenue" value={`₹${Number(data?.revenue?.total || 0).toLocaleString('en-IN')}`} icon={<RevenueIcon />} color="#2e7d32" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="This Month Revenue" value={`₹${Number(data?.revenue?.this_month || 0).toLocaleString('en-IN')}`} icon={<RevenueIcon />} color="#f57c00" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Bookings This Month" value={data?.bookings?.this_month || 0} icon={<BookingIcon />} color="#c62828" />
        </Grid>
      </Grid>

      {/* Monthly Trend - Line Chart */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12 }}>
          {(data?.monthly_trend || []).length > 0 ? (
            <AnimatedLineChartCard
              data={data.monthly_trend}
              dataKeys={['leads', 'site_visits', 'bookings']}
              xAxisKey="month"
              title="Monthly Trend (Last 6 Months)"
              colors={['#1976d2', '#7b1fa2', '#388e3c']}
              fill={true}
            />
          ) : (
            <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
              <Typography color="text.secondary">No trend data yet</Typography>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Lead Pipeline - Pie Chart */}
        <Grid size={{ xs: 12, md: 4 }}>
          {leadPipelineData.length > 0 ? (
            <PieChartCard
              data={leadPipelineData}
              title="Lead Pipeline"
            />
          ) : (
            <Paper sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="text.secondary">No lead data yet</Typography>
            </Paper>
          )}
        </Grid>

        {/* Site Visit Status - Bar Chart */}
        <Grid size={{ xs: 12, md: 4 }}>
          <AnimatedBarChartCard
            data={siteVisitChartData.map((d) => ({ name: d.name, Visits: d.value }))}
            dataKeys={['Visits']}
            xAxisKey="name"
            title="Site Visit Status"
            colors={['#4caf50', '#2196f3']}
          />
        </Grid>

        {/* Project Performance - Bar Chart */}
        <Grid size={{ xs: 12, md: 4 }}>
          {projectChartData.length > 0 ? (
            <AnimatedBarChartCard
              data={projectChartData}
              dataKeys={['Bookings', 'Registrations']}
              xAxisKey="name"
              title="Project Performance"
              colors={['#1976d2', '#00838f']}
            />
          ) : (
            <Paper sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="text.secondary">No project data yet</Typography>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Employee Performance Chart + Table */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Employee Bar Chart */}
        <Grid size={{ xs: 12, md: 6 }}>
          {employeeChartData.length > 0 ? (
            <AnimatedBarChartCard
              data={employeeChartData}
              dataKeys={['Leads', 'Site Visits', 'Bookings']}
              xAxisKey="name"
              title="Top Performers"
              colors={['#1976d2', '#7b1fa2', '#388e3c']}
            />
          ) : (
            <Paper sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="text.secondary">No employee data yet</Typography>
            </Paper>
          )}
        </Grid>

        {/* Employee Performance Table */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Employee Performance</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Leads</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Visits</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Bookings</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Reg.</TableCell>
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
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{emp.employee_name}</Typography>
                          {emp.designation && <Typography variant="caption" color="text.secondary">{emp.designation}</Typography>}
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
      </Grid>

      {/* Project Performance Table */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Project Performance</Typography>
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
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 500 }}>{proj.project_name}</Typography></TableCell>
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
    </Box>
  );
};

export default DashboardPage;
