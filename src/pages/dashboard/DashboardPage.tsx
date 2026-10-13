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
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Avatar,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  People as LeadsIcon,
  Insights as InsightsIcon,
  LocationOn as SiteVisitIcon,
  BookOnline as BookingIcon,
  Phone as PhoneIcon,
  TrendingUp as TrendIcon,
  Close as CloseIcon,
  Badge as BadgeIcon,
  Event as EventIcon,
  SupervisorAccount as ManagerIcon,
  Email as EmailIcon,
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

// ---------- Helpers ----------
const PERIOD_OPTIONS = [
  { value: 'today', label: 'Day' },
  { value: 'this_week', label: 'Week' },
  { value: 'this_month', label: 'Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'all', label: 'All Time' },
];

const formatMoney = (n: number) => {
  if (!n) return '₹0';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)} K`;
  return `₹${n.toLocaleString('en-IN')}`;
};

const formatDate = (iso?: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const bookingStatusColor: Record<string, 'success' | 'info' | 'warning' | 'error' | 'default'> = {
  REGISTERED: 'success',
  AGREEMENT: 'info',
  BOOKED: 'warning',
  CANCELLED: 'error',
};

// Compact KPI tile used inside the detail dialog.
const DetailKpi = ({ label, value, color }: { label: string; value: string | number; color?: string }) => (
  <Paper
    variant="outlined"
    sx={{ p: 1.5, textAlign: 'center', borderColor: 'divider', minWidth: 0 }}
  >
    <Typography variant="h6" sx={{ fontWeight: 700, color: color || 'text.primary', lineHeight: 1.2 }} noWrap>
      {value}
    </Typography>
    <Typography variant="caption" color="text.secondary" noWrap>{label}</Typography>
  </Paper>
);

// ---------- Employee Detail Dialog ----------
interface EmployeeDetailDialogProps {
  employeeId: string | null;
  employeeName: string;
  open: boolean;
  onClose: () => void;
}

const EmployeeDetailDialog = ({ employeeId, employeeName, open, onClose }: EmployeeDetailDialogProps) => {
  const [period, setPeriod] = useState<string>('this_month');
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Reset to Month each time a new employee is opened.
  useEffect(() => {
    if (open) setPeriod('this_month');
  }, [open, employeeId]);

  useEffect(() => {
    if (!open || !employeeId) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await reReportsApi.getEmployeePerformanceDetail(employeeId, { period });
        if (!cancelled) setDetail(res);
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load employee detail:', error);
          setDetail(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [open, employeeId, period]);

  const profile = detail?.profile;
  const summary = detail?.summary;
  const bookings = detail?.bookings || [];
  const initials = (profile?.name || employeeName || '?')
    .split(' ')
    .map((p: string) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle sx={{ p: 0 }}>
        {/* Profile header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5, pb: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 52, height: 52, fontWeight: 700 }}>
            {initials}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
              {profile?.name || employeeName}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5, alignItems: 'center' }}>
              {profile?.designation && (
                <Chip icon={<BadgeIcon sx={{ fontSize: 15 }} />} label={profile.designation} size="small" variant="outlined" />
              )}
              {profile?.status && (
                <Chip
                  label={profile.status}
                  size="small"
                  color={profile.is_active ? 'success' : 'default'}
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small" aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Meta row: joining / tenure / manager / email */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: { xs: 1.5, sm: 3 },
            px: 2.5,
            pb: 1.5,
          }}
        >
          <Tooltip title="Joining date">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <EventIcon sx={{ fontSize: 17, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                Joined {formatDate(profile?.joining_date)}
                {profile?.tenure_days != null && ` (${Math.floor(profile.tenure_days / 30)}m)`}
              </Typography>
            </Box>
          </Tooltip>
          {profile?.reporting_manager && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <ManagerIcon sx={{ fontSize: 17, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">{profile.reporting_manager}</Typography>
            </Box>
          )}
          {profile?.email && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
              <EmailIcon sx={{ fontSize: 17, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary" noWrap>{profile.email}</Typography>
            </Box>
          )}
        </Box>

        {/* Period toggle */}
        <Box sx={{ px: 2.5, pb: 1.5 }}>
          <ToggleButtonGroup
            value={period}
            exclusive
            size="small"
            onChange={(_e, v) => v && setPeriod(v)}
            sx={{ flexWrap: 'wrap' }}
          >
            {PERIOD_OPTIONS.map((p) => (
              <ToggleButton key={p.value} value={p.value} sx={{ textTransform: 'none', px: 1.5 }}>
                {p.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
        <Box sx={{ height: 3 }}>{loading && <LinearProgress />}</Box>
      </DialogTitle>

      <Divider />

      <DialogContent dividers sx={{ p: 2.5 }}>
        {/* KPI strip */}
        <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
          <Grid size={{ xs: 4, sm: 2 }}><DetailKpi label="Calls" value={summary?.calls ?? 0} color="#1976d2" /></Grid>
          <Grid size={{ xs: 4, sm: 2 }}><DetailKpi label="Leads" value={summary?.leads ?? 0} color="#388e3c" /></Grid>
          <Grid size={{ xs: 4, sm: 2 }}><DetailKpi label="Visits" value={summary?.site_visits ?? 0} color="#7b1fa2" /></Grid>
          <Grid size={{ xs: 4, sm: 2 }}><DetailKpi label="Bookings" value={summary?.bookings ?? 0} color="#00838f" /></Grid>
          <Grid size={{ xs: 4, sm: 2 }}><DetailKpi label="Registered" value={summary?.registrations ?? 0} color="#2e7d32" /></Grid>
          <Grid size={{ xs: 4, sm: 2 }}><DetailKpi label="Booking Value" value={formatMoney(summary?.booking_value ?? 0)} color="#1565c0" /></Grid>
        </Grid>

        {(summary?.revenue > 0 || summary?.incentive > 0) && (
          <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
            <Grid size={{ xs: 6, sm: 3 }}><DetailKpi label="Revenue" value={formatMoney(summary?.revenue ?? 0)} color="#2e7d32" /></Grid>
            <Grid size={{ xs: 6, sm: 3 }}><DetailKpi label="Incentive" value={formatMoney(summary?.incentive ?? 0)} color="#ef6c00" /></Grid>
          </Grid>
        )}

        {/* Bookings / Registrations list — scrollable */}
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          Bookings &amp; Registrations
          <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            ({bookings.length})
          </Typography>
        </Typography>

        <TableContainer sx={{ maxHeight: 340, border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper' }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper' }}>Project</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper' }}>Unit</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, bgcolor: 'background.paper' }}>Value</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, bgcolor: 'background.paper' }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      {loading ? 'Loading…' : 'No bookings in this period'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                bookings.map((b: any) => (
                  <TableRow key={b.id} hover>
                    <TableCell>
                      <Typography variant="body2" noWrap>{formatDate(b.booking_date)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>{b.customer_name}</Typography>
                      {b.customer_mobile && (
                        <Typography variant="caption" color="text.secondary">{b.customer_mobile}</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap>{b.project_name || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {b.unit_number || '—'}
                        {b.unit_type && (
                          <Typography component="span" variant="caption" color="text.secondary"> ({b.unit_type})</Typography>
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" noWrap>
                        {formatMoney(b.agreed_price ?? b.booking_amount ?? 0)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={b.status_label || b.status}
                        size="small"
                        color={bookingStatusColor[b.status] || 'default'}
                        variant="outlined"
                        sx={{ height: 22, fontSize: '0.7rem' }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
    </Dialog>
  );
};

// ---------- Main Component ----------
const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { setBreadcrumbs } = useBreadcrumbs();
  usePageTitle('Dashboard');

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Employee drill-down dialog
  const [selectedEmp, setSelectedEmp] = useState<{ id: string; name: string } | null>(null);

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
          <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
            — click an employee for full details
          </Typography>
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
                  <TableRow
                    key={emp.employee_id}
                    hover
                    onClick={() => setSelectedEmp({ id: emp.employee_id, name: emp.employee_name })}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 500, color: 'primary.main' }}
                      >
                        {emp.employee_name}
                      </Typography>
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

      {/* Employee drill-down dialog */}
      <EmployeeDetailDialog
        open={!!selectedEmp}
        employeeId={selectedEmp?.id ?? null}
        employeeName={selectedEmp?.name ?? ''}
        onClose={() => setSelectedEmp(null)}
      />
    </Box>
  );
};

export default DashboardPage;
