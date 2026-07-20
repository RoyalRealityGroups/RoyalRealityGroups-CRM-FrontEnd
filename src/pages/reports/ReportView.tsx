import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  CircularProgress,
  Typography,
  Chip,
} from '@mui/material';
import {
  FileDownload as ExcelIcon,
  PictureAsPdf as PdfIcon,
  ArrowBack as BackIcon,
  Home as HomeIcon,
  Assessment as ReportIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { reReportsApi } from '../../api/reReports';
import { projectsApi } from '../../api/projects';
import { leadApi } from '../../api/lead.api';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { usePageTitle } from '../../hooks';
import ScreenHeader from '../../components/common/ScreenHeader';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import apiClient from '../../api/axios.config';
import { useToast } from '../../contexts/ToastContext';

// Report configuration
const REPORT_CONFIG: Record<string, { title: string; endpoint: string; showProject: boolean; showEmployee: boolean }> = {
  'leads-source': { title: 'Lead Report — Source Wise', endpoint: 'leads/by-source', showProject: true, showEmployee: false },
  'leads-employee': { title: 'Lead Report — Employee Wise', endpoint: 'leads/by-employee', showProject: true, showEmployee: false },
  'leads-project': { title: 'Lead Report — Project Wise', endpoint: 'leads/by-project', showProject: false, showEmployee: false },
  'site-visits': { title: 'Site Visit Report', endpoint: 'site-visits', showProject: true, showEmployee: true },
  'bookings': { title: 'Booking Report', endpoint: 'bookings', showProject: true, showEmployee: false },
  'registrations': { title: 'Registration Report', endpoint: 'registrations', showProject: true, showEmployee: false },
  'revenue': { title: 'Revenue Report', endpoint: 'revenue', showProject: false, showEmployee: false },
};

const periods = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_year', label: 'This Year' },
];

const ReportView: React.FC = () => {
  const { reportType } = useParams<{ reportType: string }>();
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { error: toastError } = useToast();

  const config = REPORT_CONFIG[reportType || ''];
  usePageTitle(config?.title || 'Report');

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Reports', path: '/reports', icon: <ReportIcon fontSize="small" /> },
      { label: config?.title || 'Report' },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs, config]);

  const [period, setPeriod] = useState('this_month');
  const [project, setProject] = useState('');
  const [employee, setEmployee] = useState('');

  const { data: projects } = useQuery({
    queryKey: ['report-projects'],
    queryFn: () => projectsApi.mini(),
    staleTime: 0,
    enabled: !!config?.showProject,
  });

  const { data: employees } = useQuery({
    queryKey: ['report-employees'],
    queryFn: () => leadApi.getUsers(),
    staleTime: 0,
    enabled: !!config?.showEmployee,
  });

  const { data: reportResponse, isLoading } = useQuery({
    queryKey: ['report-view', reportType, period, project, employee],
    queryFn: () => {
      const params: any = { period, project: project || undefined, employee: employee || undefined };
      switch (reportType) {
        case 'leads-source': return reReportsApi.getLeadsBySource(params);
        case 'leads-employee': return reReportsApi.getLeadsByEmployee(params);
        case 'leads-project': return reReportsApi.getLeadsByProject(params);
        case 'site-visits': return reReportsApi.getSiteVisitReport(params);
        case 'bookings': return reReportsApi.getBookingReport(params);
        case 'registrations': return reReportsApi.getRegistrationReport(params);
        case 'revenue': return reReportsApi.getRevenueReport(params);
        default: return null;
      }
    },
    enabled: !!config,
  });

  const handleExport = async (format: 'excel' | 'pdf') => {
    if (!config) return;
    try {
      const response = await apiClient.get(`/api/re-reports/${config.endpoint}/`, {
        params: { period, project: project || undefined, employee: employee || undefined, export: format },
        responseType: 'blob',
      });
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${config.title.replace(/[^a-zA-Z0-9]/g, '_')}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      toastError(`Failed to export as ${format.toUpperCase()}`);
    }
  };

  // Dynamic grid
  const getGridConfig = (): { columns: GridColDef[]; rows: any[]; summary?: string } => {
    if (!reportResponse) return { columns: [], rows: [] };

    const dataList = Array.isArray(reportResponse)
      ? reportResponse
      : (reportResponse.data || reportResponse.results || []);

    let columns: GridColDef[] = [];
    let rows: any[] = [];
    let summary = '';

    switch (reportType) {
      case 'leads-source':
        columns = [
          { field: 'lead_source', headerName: 'Lead Source', flex: 1 },
          { field: 'count', headerName: 'Leads', type: 'number', width: 120 },
        ];
        rows = dataList.map((item: any, i: number) => ({ id: i, ...item }));
        summary = `Total: ${reportResponse.total || 0} leads`;
        break;

      case 'leads-employee':
        columns = [
          { field: 'employee_name', headerName: 'Employee', flex: 1 },
          { field: 'count', headerName: 'Leads Assigned', type: 'number', width: 140 },
        ];
        rows = dataList.map((item: any, i: number) => ({ id: i, ...item }));
        summary = `Total: ${reportResponse.total || 0} leads`;
        break;

      case 'leads-project':
        columns = [
          { field: 'project_name', headerName: 'Project', flex: 1 },
          { field: 'count', headerName: 'Interested Leads', type: 'number', width: 140 },
        ];
        rows = dataList.map((item: any, i: number) => ({ id: i, ...item }));
        summary = `Total: ${reportResponse.total || 0} leads`;
        break;

      case 'site-visits':
        columns = [
          { field: 'employee_name', headerName: 'Employee', flex: 1 },
          { field: 'count', headerName: 'Visits', type: 'number', width: 120 },
        ];
        rows = (reportResponse.by_employee || []).map((item: any, i: number) => ({ id: i, ...item }));
        summary = `Total: ${reportResponse.total || 0} | Completed: ${reportResponse.completed || 0} | Scheduled: ${reportResponse.scheduled || 0}`;
        break;

      case 'bookings':
        columns = [
          { field: 'project_name', headerName: 'Project', flex: 1 },
          { field: 'count', headerName: 'Bookings', type: 'number', width: 120 },
          { field: 'revenue', headerName: 'Revenue (₹)', type: 'number', width: 160, valueFormatter: (v: any) => v ? `₹${Number(v).toLocaleString()}` : '—' },
        ];
        rows = (reportResponse.by_project || dataList).map((item: any, i: number) => ({ id: i, ...item }));
        summary = `Total: ${reportResponse.total || 0} | Revenue: ₹${Number(reportResponse.total_revenue || 0).toLocaleString()}`;
        break;

      case 'registrations':
        columns = [
          { field: 'project_name', headerName: 'Project', flex: 1 },
          { field: 'count', headerName: 'Registrations', type: 'number', width: 130 },
          { field: 'revenue', headerName: 'Revenue (₹)', type: 'number', width: 160, valueFormatter: (v: any) => v ? `₹${Number(v).toLocaleString()}` : '—' },
        ];
        rows = (reportResponse.by_project || dataList).map((item: any, i: number) => ({ id: i, ...item }));
        summary = `Total: ${reportResponse.total || 0} | Revenue: ₹${Number(reportResponse.total_revenue || 0).toLocaleString()}`;
        break;

      case 'revenue':
        columns = [
          { field: 'month', headerName: 'Month', flex: 1 },
          { field: 'bookings', headerName: 'Bookings', type: 'number', width: 120 },
          { field: 'revenue', headerName: 'Revenue (₹)', type: 'number', width: 160, valueFormatter: (v: any) => v ? `₹${Number(v).toLocaleString()}` : '—' },
        ];
        rows = (reportResponse.monthly || dataList).map((item: any, i: number) => ({ id: i, ...item }));
        summary = `Total Revenue: ₹${Number(reportResponse.total_revenue || 0).toLocaleString()}`;
        break;
    }

    return { columns, rows, summary };
  };

  if (!config) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">Report not found</Typography>
        <Button onClick={() => navigate('/reports')} sx={{ mt: 2 }}>Back to Reports</Button>
      </Box>
    );
  }

  const { columns, rows, summary } = getGridConfig();

  return (
    <Box sx={{ p: 2 }}>
      {/* Header with Back button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <ScreenHeader title={config.title} showAddButton={false} />
        <Button startIcon={<BackIcon />} onClick={() => navigate('/reports')} variant="outlined" size="small">
          Back
        </Button>
      </Box>

      {/* Filters + Export */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Period</InputLabel>
              <Select value={period} onChange={(e) => setPeriod(e.target.value)} label="Period">
                {periods.map((p) => (
                  <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {config.showProject && (
            <Grid size={{ xs: 12, sm: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Project</InputLabel>
                <Select value={project} onChange={(e) => setProject(e.target.value)} label="Project">
                  <MenuItem value="">All Projects</MenuItem>
                  {(projects || []).map((p: any) => (
                    <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
          {config.showEmployee && (
            <Grid size={{ xs: 12, sm: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Employee</InputLabel>
                <Select value={employee} onChange={(e) => setEmployee(e.target.value)} label="Employee">
                  <MenuItem value="">All</MenuItem>
                  {(employees || []).map((emp: any) => (
                    <MenuItem key={emp.id} value={emp.id}>{emp.name || emp.username}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
          <Grid size="grow" sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button variant="outlined" size="small" startIcon={<ExcelIcon />} onClick={() => handleExport('excel')} disabled={!rows.length}>
              Excel
            </Button>
            <Button variant="outlined" size="small" startIcon={<PdfIcon />} onClick={() => handleExport('pdf')} disabled={!rows.length}>
              PDF
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary */}
      {summary && !isLoading && rows.length > 0 && (
        <Box sx={{ mb: 1 }}>
          <Chip label={summary} variant="outlined" color="primary" size="small" />
        </Box>
      )}

      {/* Data Table */}
      <Paper sx={{ height: 500 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : rows.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', gap: 1 }}>
            <ReportIcon color="disabled" sx={{ fontSize: 48 }} />
            <Typography variant="body1" color="text.secondary">No data found for selected filters.</Typography>
          </Box>
        ) : (
          <DataGrid
            rows={rows}
            columns={columns}
            pageSizeOptions={[10, 25, 50]}
            initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
            disableRowSelectionOnClick
          />
        )}
      </Paper>
    </Box>
  );
};

export default ReportView;
