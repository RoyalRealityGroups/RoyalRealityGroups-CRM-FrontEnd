/**
 * Module 12 - Dashboard
 *
 * Layout:
 *   Row 1: KPI Cards — Today's Insights (clickable), Total Leads, Site Visits, Bookings
 *   Row 2: Employee Performance Table (with calls column)
 *   Row 3: Calling Trend (hourly bar chart for today)
 *   Row 4: Lead Pipeline (Pie) + Site Visit Status (Bar)
 *   Row 5: Project Performance Table
 *
 * Data scoping: Regular users see only their own data; admins see all.
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
  Insights as InsightsIcon,
  LocationOn as SiteVisitIcon,
  BookOnline as BookingIcon,
  Phone as PhoneIcon,
  TrendingUp as TrendIcon,
} from '@mui/icons-material';
import { reReportsApi } from '../../api/reReports';
import { usePageTitle } from '../../hooks';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { PieChartCard, AnimatedBarChartCard } from '../../components/ui/ChartJS';

// ---------- Stat Card ----------
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
  subtitle?: string;
}

const StatCard = ({ title, value, icon, color, onClick, subtitle }: StatCardProps) => (
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
      {subtitle && (
        <Typography variant="caption" sx={{ color, fontWeight: 500 }}>{subtitle}</Typography>
      )}
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

  // Calling trend chart data (hourly)
  const callingTrendData = (data?.calling_trend || []).map((h: any) => ({
    name: h.label,
    Calls: h.calls,
  }));

  // Lead pipeline pie
  const leadPipelineData = (data?.lead_pipeline || []).map((item: any) => ({
    name: item.status?.replace(/_/g, ' ') || 'Unknown',
    value: item.count || 0,
  }));

  // Site visit chart
  const siteVisitChartData = [
    { name: 'Completed', Visits: data?.site_visits?.completed || 0 },
    { name: 'Scheduled', Visits: data?.site_visits?.scheduled || 0 },
  ];

  // Project performance chart
  const projectChartData = (data?.project_performance || []).map((p: any) => ({
    name: p.project_name,
    Bookings: p.bookings,
    Registrations: p.registrations,
  }));

  // Today's insights summary
  const insights = data?.todays_insights || {};
  const insightsSummary = `${insights.calls || 0} calls · ${insights.leads_entered || 0} leads · ${insights.follow_ups || 0} follow-ups`;

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, overflow: 'auto', height: '100%' }}>
      {/* Welcome */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {getGreeting()}, {user?.first_name || user?.username}!
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Here's your overview for today
          {data?.is_admin_view && (
            <Chip label="Admin View" size="small" color="primary" variant="outlined" sx={{ ml: 1 }} />
          )}
        </Typography>
      </Box>

      {/* Row 1: KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Today's Insights"
            value={insights.calls || 0}
            icon={<InsightsIcon />}
            color="#0288d1"
            onClick={() => navigate('/dashboard/insights')}
            subtitle={insightsSummary}
          />
        </Grid>
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
      </Grid>

      {/* Row 2: Employee Performance Table */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <TrendIcon sx={{ color: '#1976d2' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Employee Performance</Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                    <PhoneIcon sx={{ fontSize: 16 }} /> Calls Today
                  </Box>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>Calls Total</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>Leads</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>Visits</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>Bookings</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>Reg.</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(data?.employee_performance || []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary">No data</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                (data?.employee_performance || []).map((emp: any) => (
                  <TableRow key={emp.employee_id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{emp.employee_name}</Typography>
                      {emp.designation && <Typography variant="caption" color="text.secondary">{emp.designation}</Typography>}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={emp.calls_today}
                        size="small"
                        color={emp.calls_today > 0 ? 'primary' : 'default'}
                        variant={emp.calls_today > 0 ? 'filled' : 'outlined'}
                        sx={{ fontWeight: 600, minWidth: 36 }}
                      />
                    </TableCell>
                    <TableCell align="center">{emp.calls_total}</TableCell>
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

      {/* Row 3: Calling Trend (Hourly) */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12 }}>
          {callingTrendData.some((d: any) => d.Calls > 0) ? (
            <AnimatedBarChartCard
              data={callingTrendData}
              dataKeys={['Calls']}
              xAxisKey="name"
              title="Calling Trend (Today — Hourly)"
              colors={['#1976d2']}
              height={250}
            />
          ) : (
            <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
              <Typography color="text.secondary">No calling data yet for today</Typography>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Row 4: Lead Pipeline + Site Visit Status */}
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
            data={siteVisitChartData}
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

      {/* Row 5: Project Performance Table */}
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
                  <TableRow key={proj.project_id} hover>
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
