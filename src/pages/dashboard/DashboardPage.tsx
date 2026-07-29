/**
 * Module 12 - Dashboard (Redesigned)
 *
 * Lead Summary: Total Leads, Hot Leads, Prospects
 * Today's Insights: Calls Made, Connected Calls, Site Visits Scheduled/Completed
 * Performance Analytics: Pie (Lead Pipeline), Bar (Employee Performance), Line (Monthly Trend)
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
  alpha,
  useTheme,
} from '@mui/material';
import {
  People as LeadsIcon,
  Whatshot as HotIcon,
  PersonSearch as ProspectIcon,
  Phone as CallIcon,
  PhoneCallback as ConnectedIcon,
  LocationOn as SiteVisitIcon,
  CheckCircle as CompletedIcon,
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

const StatCard = ({ title, value, icon, color, onClick }: StatCardProps) => {
  const theme = useTheme();
  return (
    <Paper
      onClick={onClick}
      elevation={0}
      sx={{
        p: 2.5, display: 'flex', alignItems: 'center', gap: 2,
        cursor: onClick ? 'pointer' : 'default',
        border: '1px solid', borderColor: 'divider', borderRadius: 3,
        transition: 'all 0.2s',
        '&:hover': onClick ? { transform: 'translateY(-2px)', boxShadow: 3, borderColor: color } : {},
      }}
    >
      <Box sx={{
        width: 48, height: 48, borderRadius: 2,
        bgcolor: alpha(color, 0.1),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: color, flexShrink: 0,
      }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{value}</Typography>
        <Typography variant="body2" color="text.secondary">{title}</Typography>
      </Box>
    </Paper>
  );
};

// ---------- Section Header ----------
const SectionHeader = ({ title }: { title: string }) => (
  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: 'text.primary' }}>
    {title}
  </Typography>
);

// ---------- Main Component ----------
const DashboardPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
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
  const leadPipelineData = (data?.lead_pipeline || []).map((item: any) => ({
    name: item.status?.replace(/_/g, ' ') || 'Unknown',
    value: item.count || 0,
  }));

  const employeeChartData = (data?.employee_performance || []).slice(0, 6).map((e: any) => ({
    name: e.employee_name?.split(' ')[0] || 'Emp',
    Leads: e.leads,
    'Site Visits': e.site_visits,
    Bookings: e.bookings,
  }));

  // Daily performance for bar chart (site visit statuses)
  const dailyPerformanceData = [
    { name: 'Calls Made', value: data?.todays_insights?.calls_made || 0 },
    { name: 'Connected', value: data?.todays_insights?.connected_calls || 0 },
    { name: 'SV Scheduled', value: data?.todays_insights?.site_visits_scheduled || 0 },
    { name: 'SV Completed', value: data?.todays_insights?.site_visits_completed || 0 },
  ];

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

      {/* Lead Summary */}
      <SectionHeader title="Lead Summary" />
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Total Leads"
            value={data?.leads?.total || 0}
            icon={<LeadsIcon />}
            color="#1976d2"
            onClick={() => navigate('/lead/list')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Hot Leads"
            value={data?.leads?.hot_leads || 0}
            icon={<HotIcon />}
            color="#E53935"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Prospects"
            value={data?.leads?.prospects || 0}
            icon={<ProspectIcon />}
            color="#F57C00"
          />
        </Grid>
      </Grid>

      {/* Today's Insights */}
      <SectionHeader title="Today's Insights" />
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Calls Made"
            value={data?.todays_insights?.calls_made || 0}
            icon={<CallIcon />}
            color="#7B1FA2"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Connected Calls"
            value={data?.todays_insights?.connected_calls || 0}
            icon={<ConnectedIcon />}
            color="#00897B"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Site Visits Scheduled"
            value={data?.todays_insights?.site_visits_scheduled || 0}
            icon={<SiteVisitIcon />}
            color="#3B82F6"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Site Visits Completed"
            value={data?.todays_insights?.site_visits_completed || 0}
            icon={<CompletedIcon />}
            color="#10B981"
          />
        </Grid>
      </Grid>

      {/* Performance Analytics */}
      <SectionHeader title="Performance Analytics" />
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Lead Pipeline - Pie Chart */}
        <Grid size={{ xs: 12, md: 4 }}>
          {leadPipelineData.length > 0 ? (
            <PieChartCard data={leadPipelineData} title="Lead Conversion Funnel" />
          ) : (
            <Paper sx={{ p: 3, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 3 }}>
              <Typography color="text.secondary">No lead data yet</Typography>
            </Paper>
          )}
        </Grid>

        {/* Daily Performance - Bar Chart */}
        <Grid size={{ xs: 12, md: 4 }}>
          <AnimatedBarChartCard
            data={dailyPerformanceData.map((d) => ({ name: d.name, Count: d.value }))}
            dataKeys={['Count']}
            xAxisKey="name"
            title="Daily Performance"
            colors={['#7B1FA2']}
          />
        </Grid>

        {/* Sales Performance - Employee Bar */}
        <Grid size={{ xs: 12, md: 4 }}>
          {employeeChartData.length > 0 ? (
            <AnimatedBarChartCard
              data={employeeChartData}
              dataKeys={['Leads', 'Site Visits', 'Bookings']}
              xAxisKey="name"
              title="Sales Performance"
              colors={['#1976d2', '#7b1fa2', '#388e3c']}
            />
          ) : (
            <Paper sx={{ p: 3, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 3 }}>
              <Typography color="text.secondary">No performance data yet</Typography>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Monthly Trend - Line Chart */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          {(data?.monthly_trend || []).length > 0 ? (
            <AnimatedLineChartCard
              data={data.monthly_trend}
              dataKeys={['leads', 'site_visits', 'bookings']}
              xAxisKey="month"
              title="Monthly Trend (Last 12 Months)"
              colors={['#1976d2', '#7b1fa2', '#388e3c']}
              fill={true}
            />
          ) : (
            <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, borderRadius: 3 }}>
              <Typography color="text.secondary">No trend data yet</Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
