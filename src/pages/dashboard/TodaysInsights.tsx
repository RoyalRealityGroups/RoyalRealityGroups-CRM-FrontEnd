/**
 * Today's Insights - Detailed View
 *
 * Shows granular daily activity breakdown:
 *   - Summary cards (calls, leads, follow-ups, site visits, bookings)
 *   - Calls by type breakdown
 *   - Hourly call distribution chart
 *   - Leads entered by source
 *   - Recent calls log
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  PersonAdd as LeadIcon,
  EventNote as FollowUpIcon,
  LocationOn as SiteVisitIcon,
  BookOnline as BookingIcon,
  ArrowBack as BackIcon,
  TrendingUp as PeakIcon,
  Timer as DurationIcon,
  CallMade as OutgoingIcon,
  CallReceived as IncomingIcon,
  CallMissed as MissedIcon,
} from '@mui/icons-material';
import { reReportsApi } from '../../api/reReports';
import { usePageTitle } from '../../hooks';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { AnimatedBarChartCard } from '../../components/ui/ChartJS';

// ---------- Mini Stat Card ----------
interface MiniStatProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

const MiniStat = ({ title, value, icon, color, subtitle }: MiniStatProps) => (
  <Paper
    sx={{
      p: 2,
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      border: 1,
      borderColor: 'divider',
      transition: 'box-shadow 0.2s',
      '&:hover': { boxShadow: 2 },
    }}
  >
    <Box
      sx={{
        width: 40, height: 40, borderRadius: 1.5,
        bgcolor: `${color}15`, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        color, flexShrink: 0,
      }}
    >
      {icon}
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{value}</Typography>
      <Typography variant="caption" color="text.secondary" noWrap>{title}</Typography>
      {subtitle && (
        <Typography variant="caption" display="block" sx={{ color, fontWeight: 500 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  </Paper>
);

// ---------- Call Type Chip ----------
const callTypeConfig: Record<string, { label: string; color: 'success' | 'info' | 'warning' | 'error' | 'default'; icon: React.ReactNode }> = {
  outgoing: { label: 'Outgoing', color: 'success', icon: <OutgoingIcon fontSize="small" /> },
  incoming: { label: 'Incoming', color: 'info', icon: <IncomingIcon fontSize="small" /> },
  missed: { label: 'Missed', color: 'error', icon: <MissedIcon fontSize="small" /> },
  rejected: { label: 'Rejected', color: 'warning', icon: <MissedIcon fontSize="small" /> },
  unknown: { label: 'Unknown', color: 'default', icon: <PhoneIcon fontSize="small" /> },
};

// ---------- Format duration ----------
const formatDuration = (secs: number) => {
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const remaining = secs % 60;
  if (mins < 60) return `${mins}m ${remaining}s`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
};

// ---------- Main Component ----------
const TodaysInsights = () => {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbs();
  usePageTitle("Today's Insights");

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Dashboard', path: '/dashboard' },
      { label: "Today's Insights" },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await reReportsApi.getTodaysInsights();
        setData(response);
      } catch (error) {
        console.error('Failed to load insights:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">Unable to load today's insights</Typography>
      </Box>
    );
  }

  const { summary, calls_by_type, leads_by_source, followups_by_type, hourly_distribution, recent_calls } = data;

  // Prepare hourly chart data
  const hourlyChartData = (hourly_distribution || []).map((h: any) => ({
    name: h.label,
    Calls: h.calls,
  }));

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, overflow: 'auto', height: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <IconButton onClick={() => navigate('/dashboard')} size="small">
          <BackIcon />
        </IconButton>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Today's Insights
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {data.is_admin_view && (
              <Chip label="All Employees" size="small" color="primary" variant="outlined" sx={{ ml: 1 }} />
            )}
          </Typography>
        </Box>
      </Box>

      {/* Summary Cards Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <MiniStat
            title="Total Calls"
            value={summary.total_calls}
            icon={<PhoneIcon />}
            color="#1976d2"
            subtitle={summary.peak_hour ? `Peak: ${summary.peak_hour.label}` : undefined}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <MiniStat
            title="Leads Entered"
            value={summary.leads_entered}
            icon={<LeadIcon />}
            color="#388e3c"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <MiniStat
            title="Follow-ups Done"
            value={summary.follow_ups_done}
            icon={<FollowUpIcon />}
            color="#f57c00"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <MiniStat
            title="Site Visits"
            value={summary.site_visits}
            icon={<SiteVisitIcon />}
            color="#7b1fa2"
            subtitle={summary.site_visits_completed > 0 ? `${summary.site_visits_completed} completed` : undefined}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <MiniStat
            title="Bookings"
            value={summary.bookings}
            icon={<BookingIcon />}
            color="#00838f"
          />
        </Grid>
      </Grid>

      {/* Call Stats + Duration */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 2, border: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <DurationIcon sx={{ color: '#5e35b1' }} fontSize="small" />
              <Typography variant="subtitle2" color="text.secondary">Call Duration</Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {formatDuration(summary.total_duration_secs)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Avg: {formatDuration(Math.round(summary.avg_duration_secs))} per call
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 2, border: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <PeakIcon sx={{ color: '#c62828' }} fontSize="small" />
              <Typography variant="subtitle2" color="text.secondary">Peak Hour</Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {summary.peak_hour?.label || '--'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {summary.peak_hour ? `${summary.peak_hour.calls} calls` : 'No calls yet'}
            </Typography>
          </Paper>
        </Grid>
        {/* Call type breakdown */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2, border: 1, borderColor: 'divider', height: '100%' }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Calls by Type</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {(calls_by_type || []).map((ct: any) => {
                const config = callTypeConfig[ct.call_type] || callTypeConfig.unknown;
                return (
                  <Chip
                    key={ct.call_type}
                    icon={config.icon as React.ReactElement}
                    label={`${config.label}: ${ct.count}`}
                    color={config.color}
                    variant="outlined"
                    size="small"
                  />
                );
              })}
              {(!calls_by_type || calls_by_type.length === 0) && (
                <Typography variant="body2" color="text.secondary">No calls recorded</Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Hourly Distribution Chart */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12 }}>
          {hourlyChartData.length > 0 ? (
            <AnimatedBarChartCard
              data={hourlyChartData}
              dataKeys={['Calls']}
              xAxisKey="name"
              title="Calling Activity by Hour"
              colors={['#1976d2']}
              height={250}
            />
          ) : (
            <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
              <Typography color="text.secondary">No calling data yet</Typography>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Leads by Source + Follow-ups by Type */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2, border: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>Leads by Source</Typography>
            {(leads_by_source || []).length === 0 ? (
              <Typography variant="body2" color="text.secondary">No leads entered today</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {leads_by_source.map((ls: any) => (
                  <Chip
                    key={ls.lead_source}
                    label={`${ls.lead_source}: ${ls.count}`}
                    size="small"
                    variant="filled"
                    sx={{ bgcolor: '#e3f2fd', color: '#1565c0', fontWeight: 500 }}
                  />
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2, border: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>Follow-ups by Type</Typography>
            {(followups_by_type || []).length === 0 ? (
              <Typography variant="body2" color="text.secondary">No follow-ups today</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {followups_by_type.map((ft: any) => (
                  <Chip
                    key={ft.follow_up_type}
                    label={`${ft.follow_up_type}: ${ft.count}`}
                    size="small"
                    variant="filled"
                    sx={{ bgcolor: '#fff3e0', color: '#e65100', fontWeight: 500 }}
                  />
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Calls Table */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Recent Calls</Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Duration</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Lead</TableCell>
                {data.is_admin_view && <TableCell sx={{ fontWeight: 600 }}>Called By</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {(recent_calls || []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={data.is_admin_view ? 6 : 5} align="center">
                    <Typography variant="body2" color="text.secondary">No calls recorded today</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                recent_calls.map((call: any) => {
                  const config = callTypeConfig[call.call_type] || callTypeConfig.unknown;
                  const callTime = new Date(call.called_at);
                  return (
                    <TableRow key={call.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {call.phone_number}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={config.label}
                          color={config.color}
                          variant="outlined"
                          sx={{ height: 22, fontSize: '0.7rem' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{formatDuration(call.duration_secs)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {callTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {call.lead_name ? (
                          <Tooltip title="View Lead">
                            <Typography
                              variant="body2"
                              sx={{ color: 'primary.main', cursor: 'pointer', fontWeight: 500 }}
                              onClick={() => call.lead_id && navigate(`/lead/view/${call.lead_id}`)}
                            >
                              {call.lead_name}
                            </Typography>
                          </Tooltip>
                        ) : (
                          <Typography variant="body2" color="text.secondary">—</Typography>
                        )}
                      </TableCell>
                      {data.is_admin_view && (
                        <TableCell>
                          <Typography variant="body2">{call.called_by_name}</Typography>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default TodaysInsights;
