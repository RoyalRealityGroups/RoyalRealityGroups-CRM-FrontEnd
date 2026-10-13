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
  TablePagination,
  IconButton,
  Tooltip,
  TextField,
  MenuItem,
  Button,
  LinearProgress,
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
  Clear as ClearIcon,
} from '@mui/icons-material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import type { Dayjs } from 'dayjs';
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

// ---------- Recent Calls (filterable + paginated) ----------
interface EmployeeOption {
  id: string;
  name: string;
}

const CALL_TYPE_OPTIONS = [
  { value: 'outgoing', label: 'Outgoing' },
  { value: 'incoming', label: 'Incoming' },
  { value: 'missed', label: 'Missed' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'unknown', label: 'Unknown' },
];

const RecentCallsCard = ({ isAdminView }: { isAdminView: boolean }) => {
  const navigate = useNavigate();

  // Filters
  const [fromTime, setFromTime] = useState<Dayjs | null>(null);
  const [toTime, setToTime] = useState<Dayjs | null>(null);
  const [callType, setCallType] = useState<string>('');
  const [employee, setEmployee] = useState<string>('');

  // Pagination (page is 0-based for MUI TablePagination)
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Data
  const [rows, setRows] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(false);

  const colSpan = isAdminView ? 6 : 5;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await reReportsApi.getTodaysCalls({
          from_time: fromTime && fromTime.isValid() ? fromTime.format('HH:mm') : undefined,
          to_time: toTime && toTime.isValid() ? toTime.format('HH:mm') : undefined,
          call_type: callType || undefined,
          employee: employee || undefined,
          page: page + 1, // backend is 1-based
          page_size: pageSize,
        });
        if (cancelled) return;
        setRows(res.results || []);
        setCount(res.count || 0);
        if (res.employees && res.employees.length > 0) {
          setEmployees(res.employees);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load calls:', error);
          setRows([]);
          setCount(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [fromTime, toTime, callType, employee, page, pageSize]);

  // Any filter change resets to the first page.
  const onFilterChange = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    setPage(0);
  };

  const onTimeChange = (setter: (v: Dayjs | null) => void) => (value: Dayjs | null) => {
    setter(value);
    setPage(0);
  };

  const clearFilters = () => {
    setFromTime(null);
    setToTime(null);
    setCallType('');
    setEmployee('');
    setPage(0);
  };

  // Range sanity: if both set and From is after To, flag it (don't block fetch).
  const invalidRange = !!(
    fromTime && toTime && fromTime.isValid() && toTime.isValid() && fromTime.isAfter(toTime)
  );

  const hasFilters = !!fromTime || !!toTime || callType !== '' || employee !== '';

  return (
    <Paper sx={{ p: 2 }}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
          mb: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Recent Calls
          {count > 0 && (
            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              ({count} total)
            </Typography>
          )}
        </Typography>

        {/* Filters */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
          <TimePicker
            label="From time"
            value={fromTime}
            onChange={onTimeChange(setFromTime)}
            ampm
            slotProps={{
              textField: {
                size: 'small',
                sx: { minWidth: 150 },
                error: invalidRange,
                helperText: invalidRange ? 'From is after To' : undefined,
              },
              field: { clearable: true },
            }}
          />

          <TimePicker
            label="To time"
            value={toTime}
            onChange={onTimeChange(setToTime)}
            ampm
            slotProps={{
              textField: {
                size: 'small',
                sx: { minWidth: 150 },
                error: invalidRange,
              },
              field: { clearable: true },
            }}
          />

          <TextField
            select
            size="small"
            label="Call type"
            value={callType}
            onChange={(e) => onFilterChange(setCallType)(e.target.value)}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="">All types</MenuItem>
            {CALL_TYPE_OPTIONS.map((ct) => (
              <MenuItem key={ct.value} value={ct.value}>
                {ct.label}
              </MenuItem>
            ))}
          </TextField>

          {isAdminView && (
            <TextField
              select
              size="small"
              label="Called by"
              value={employee}
              onChange={(e) => onFilterChange(setEmployee)(e.target.value)}
              sx={{ minWidth: 170 }}
            >
              <MenuItem value="">All employees</MenuItem>
              {employees.map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>
                  {emp.name}
                </MenuItem>
              ))}
            </TextField>
          )}

          {hasFilters && (
            <Button size="small" startIcon={<ClearIcon fontSize="small" />} onClick={clearFilters}>
              Clear
            </Button>
          )}
        </Box>
      </Box>

      <Box sx={{ height: 3, mb: 0.5 }}>{loading && <LinearProgress />}</Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Duration</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Lead</TableCell>
              {isAdminView && <TableCell sx={{ fontWeight: 600 }}>Called By</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    {loading
                      ? 'Loading calls…'
                      : hasFilters
                        ? 'No calls match the selected filters'
                        : 'No calls recorded today'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((call: any) => {
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
                    {isAdminView && (
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

      <TablePagination
        component="div"
        count={count}
        page={count > 0 ? page : 0}
        onPageChange={(_e, newPage) => setPage(newPage)}
        rowsPerPage={pageSize}
        onRowsPerPageChange={(e) => {
          setPageSize(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[10, 20, 50]}
        labelRowsPerPage="Rows per page:"
      />
    </Paper>
  );
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

  const { summary, calls_by_type, leads_by_source, followups_by_type, hourly_distribution } = data;

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
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <MiniStat
            title="Total Calls"
            value={summary.total_calls}
            icon={<PhoneIcon />}
            color="#1976d2"
            subtitle={summary.peak_hour ? `Peak: ${summary.peak_hour.label}` : undefined}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <MiniStat
            title="Connected"
            value={summary.connected_calls ?? 0}
            icon={<IncomingIcon />}
            color="#2e7d32"
            subtitle={
              summary.total_calls > 0
                ? `${Math.round(((summary.connected_calls ?? 0) / summary.total_calls) * 100)}% answered`
                : undefined
            }
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <MiniStat
            title="Dialed"
            value={summary.dialed_calls ?? 0}
            icon={<MissedIcon />}
            color="#c62828"
            subtitle="Called, no answer"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <MiniStat
            title="Leads Entered"
            value={summary.leads_entered}
            icon={<LeadIcon />}
            color="#388e3c"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <MiniStat
            title="Follow-ups Done"
            value={summary.follow_ups_done}
            icon={<FollowUpIcon />}
            color="#f57c00"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <MiniStat
            title="Site Visits"
            value={summary.site_visits}
            icon={<SiteVisitIcon />}
            color="#7b1fa2"
            subtitle={summary.site_visits_completed > 0 ? `${summary.site_visits_completed} completed` : undefined}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
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

      {/* Recent Calls — filterable + paginated */}
      <RecentCallsCard isAdminView={!!data.is_admin_view} />
    </Box>
  );
};

export default TodaysInsights;
