import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  CircularProgress,
  Typography,
} from '@mui/material';
import {
  GetApp as DownloadIcon,
  Home as HomeIcon,
  Assessment as AssessmentIcon,
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
import {
  getPageContainerStyles,
  getHeaderSectionStyles,
  getContentSectionStyles,
  getDataGridStyles,
} from '../../utils/spacing';

const periods = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_year', label: 'This Year' },
];

const reportTabs = [
  { value: 'leads-by-source', label: 'Leads by Source', endpoint: 'leads/by-source' },
  { value: 'leads-by-employee', label: 'Leads by Employee', endpoint: 'leads/by-employee' },
  { value: 'leads-by-project', label: 'Leads by Project', endpoint: 'leads/by-project' },
  { value: 'leads-by-status', label: 'Leads by Status', endpoint: 'leads/by-status' },
  { value: 'site-visits', label: 'Site Visits', endpoint: 'site-visits' },
  { value: 'bookings', label: 'Bookings', endpoint: 'bookings' },
  { value: 'revenue', label: 'Revenue Report', endpoint: 'revenue' },
  { value: 'employee-performance', label: 'Employee Performance', endpoint: 'employee-performance' },
];

const RealEstateReports: React.FC = () => {
  const { setBreadcrumbs } = useBreadcrumbs();
  usePageTitle('Real Estate Reports');

  // Breadcrumbs
  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Reports', path: '/reports' },
      { label: 'Real Estate Reports' },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  // States
  const [activeTab, setActiveTab] = useState('leads-by-source');
  const [period, setPeriod] = useState('this_month');
  const [project, setProject] = useState('');
  const [employee, setEmployee] = useState('');

  // Dropdowns data
  const { data: projects } = useQuery({
    queryKey: ['projects-mini'],
    queryFn: () => projectsApi.mini(),
  });

  const { data: employees } = useQuery({
    queryKey: ['employees-dropdown'],
    queryFn: () => leadApi.getUsers(),
  });

  // Query report data dynamically
  const { data: reportResponse, isLoading } = useQuery({
    queryKey: ['re-report', activeTab, period, project, employee],
    queryFn: () => {
      const params = { period, project: project || undefined, employee: employee || undefined };
      switch (activeTab) {
        case 'leads-by-source':
          return reReportsApi.getLeadsBySource(params);
        case 'leads-by-employee':
          return reReportsApi.getLeadsByEmployee(params);
        case 'leads-by-project':
          return reReportsApi.getLeadsByProject(params);
        case 'leads-by-status':
          return reReportsApi.getLeadsByStatus(params);
        case 'site-visits':
          return reReportsApi.getSiteVisitReport(params);
        case 'bookings':
          return reReportsApi.getBookingReport(params);
        case 'revenue':
          return reReportsApi.getRevenueReport(params);
        case 'employee-performance':
          return reReportsApi.getEmployeePerformance(params);
        default:
          return null;
      }
    },
  });

  const handleExport = () => {
    const tabObj = reportTabs.find(t => t.value === activeTab);
    if (!tabObj) return;
    const params: Record<string, string> = { period };
    if (project) params.project = project;
    if (employee) params.employee = employee;

    const url = reReportsApi.getExportUrl(tabObj.endpoint, params);
    window.open(url, '_blank');
  };

  // Dynamically resolve columns and rows
  const getGridConfiguration = (): { columns: GridColDef[]; rows: any[] } => {
    let columns: GridColDef[] = [];
    let rows: any[] = [];

    if (!reportResponse) return { columns, rows };

    const dataList = Array.isArray(reportResponse)
      ? reportResponse
      : (reportResponse.data || reportResponse.results || []);

    switch (activeTab) {
      case 'leads-by-source':
        columns = [
          { field: 'lead_source', headerName: 'Lead Source', flex: 1 },
          { field: 'count', headerName: 'Number of Leads', type: 'number', flex: 1 },
        ];
        rows = dataList.map((item: any, i: number) => ({ id: i, ...item }));
        break;

      case 'leads-by-employee':
        columns = [
          { field: 'employee_name', headerName: 'Assigned Executive', flex: 1 },
          { field: 'count', headerName: 'Number of Leads', type: 'number', flex: 1 },
        ];
        rows = dataList.map((item: any, i: number) => ({ id: i, ...item }));
        break;

      case 'leads-by-project':
        columns = [
          { field: 'project_name', headerName: 'Project Name', flex: 1 },
          { field: 'count', headerName: 'Interested Leads', type: 'number', flex: 1 },
        ];
        rows = dataList.map((item: any, i: number) => ({ id: i, ...item }));
        break;

      case 'leads-by-status':
        columns = [
          { field: 'status', headerName: 'Pipeline Stage', flex: 1 },
          { field: 'count', headerName: 'Leads count', type: 'number', flex: 1 },
        ];
        rows = dataList.map((item: any, i: number) => ({ id: i, ...item }));
        break;

      case 'site-visits':
        // Site visits report endpoint returns site visits list or employee-wise summary
        columns = [
          { field: 'employee_name', headerName: 'Executive', flex: 1 },
          { field: 'count', headerName: 'Site Visits Handled', type: 'number', flex: 1 },
        ];
        rows = (reportResponse.by_employee || []).map((item: any, i: number) => ({ id: i, ...item }));
        break;

      case 'bookings':
        columns = [
          { field: 'customer_name', headerName: 'Customer Name', flex: 1 },
          { field: 'project_name', headerName: 'Project', flex: 1 },
          { field: 'unit_number', headerName: 'Unit No.', flex: 1 },
          {
            field: 'agreed_price',
            headerName: 'Agreed Price',
            type: 'number',
            flex: 1,
            valueFormatter: (value) => value ? `₹${Number(value).toLocaleString()}` : '—',
          },
          {
            field: 'booking_amount',
            headerName: 'Downpayment',
            type: 'number',
            flex: 1,
            valueFormatter: (value) => value ? `₹${Number(value).toLocaleString()}` : '—',
          },
          { field: 'status', headerName: 'Status', flex: 1 },
        ];
        rows = dataList.map((item: any, i: number) => ({ id: i, ...item }));
        break;

      case 'revenue':
        columns = [
          { field: 'project_name', headerName: 'Project Name', flex: 1.5 },
          { field: 'bookings_count', headerName: 'Bookings Done', type: 'number', flex: 1 },
          {
            field: 'total_value',
            headerName: 'Total Sales Value',
            type: 'number',
            flex: 1.2,
            valueFormatter: (value) => value ? `₹${Number(value).toLocaleString()}` : '—',
          },
          {
            field: 'collections',
            headerName: 'Collected Revenue',
            type: 'number',
            flex: 1.2,
            valueFormatter: (value) => value ? `₹${Number(value).toLocaleString()}` : '—',
          },
        ];
        rows = dataList.map((item: any, i: number) => ({ id: i, ...item }));
        break;

      case 'employee-performance':
        columns = [
          { field: 'employee_name', headerName: 'Employee / Executive', flex: 1.5 },
          { field: 'leads_assigned', headerName: 'Leads Assigned', type: 'number', flex: 1 },
          { field: 'site_visits_done', headerName: 'Site Visits', type: 'number', flex: 1 },
          { field: 'bookings_made', headerName: 'Bookings Made', type: 'number', flex: 1 },
          { field: 'registrations_done', headerName: 'Registrations', type: 'number', flex: 1 },
          {
            field: 'conversion_rate',
            headerName: 'Conversion %',
            type: 'number',
            flex: 1,
            valueFormatter: (value) => value ? `${parseFloat(value).toFixed(1)}%` : '0%',
          },
        ];
        rows = dataList.map((item: any, i: number) => ({ id: i, ...item }));
        break;
    }

    return { columns, rows };
  };

  const { columns, rows } = getGridConfiguration();

  return (
    <Box sx={getPageContainerStyles()}>
      <Box sx={getHeaderSectionStyles()}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <ScreenHeader
            title="Real Estate Analytics & Reports"
            subtitle="Analyze lead flows, executive conversion rates, property inventories, and revenue statistics"
          />
          <Button
            variant="contained"
            color="secondary"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={!rows.length}
          >
            Export to Excel
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          {reportTabs.map((tab) => (
            <Tab key={tab.value} label={tab.label} value={tab.value} />
          ))}
        </Tabs>
      </Paper>

      {/* Filter Row */}
      <Box sx={getContentSectionStyles()}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Time Period</InputLabel>
              <Select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                label="Time Period"
              >
                {periods.map((p) => (
                  <MenuItem key={p.value} value={p.value}>
                    {p.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Render project filter only for reports that accept it */}
          {activeTab !== 'leads-by-project' && activeTab !== 'leads-by-status' && activeTab !== 'employee-performance' && (
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Project Filter</InputLabel>
                <Select
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  label="Project Filter"
                >
                  <MenuItem value="">All Projects</MenuItem>
                  {projects?.map((proj) => (
                    <MenuItem key={proj.id} value={proj.id}>
                      {proj.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {/* Render employee filter only for site visits */}
          {activeTab === 'site-visits' && (
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Executive Filter</InputLabel>
                <Select
                  value={employee}
                  onChange={(e) => setEmployee(e.target.value)}
                  label="Executive Filter"
                >
                  <MenuItem value="">All Executives</MenuItem>
                  {employees?.map((emp: any) => (
                    <MenuItem key={emp.id} value={emp.id}>
                      {emp.first_name ? `${emp.first_name} ${emp.last_name || ''}` : emp.username}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
        </Grid>

        {/* Data Grid Table */}
        <Paper sx={{ height: 450, width: '100%' }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          ) : rows.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', gap: 1 }}>
              <AssessmentIcon color="disabled" sx={{ fontSize: 48 }} />
              <Typography variant="body1" color="text.secondary">
                No matching reports records found.
              </Typography>
            </Box>
          ) : (
            <DataGrid
              rows={rows}
              columns={columns}
              pageSizeOptions={[10, 20, 50]}
              initialState={{
                pagination: { paginationModel: { page: 0, pageSize: 10 } }
              }}
              sx={getDataGridStyles()}
            />
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default RealEstateReports;
