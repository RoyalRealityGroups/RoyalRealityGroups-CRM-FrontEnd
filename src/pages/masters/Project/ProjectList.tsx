import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Button, IconButton, Tooltip, TextField, Chip, Select, MenuItem,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  FileDownload as ExcelIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store/store';
import { hasPermission } from '../../../utils/permissions';
import { projectsApi } from '../../../api/projects';
import apiClient from '../../../api/axios.config';
import type { Project } from '../../../types/project.types';
import { useToast } from '../../../contexts/ToastContext';
import { usePageTitle } from '../../../hooks';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import ScreenHeader from '../../../components/common/ScreenHeader';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import HomeIcon from '@mui/icons-material/Home';
import BusinessIcon from '@mui/icons-material/Business';

const ProjectList: React.FC = () => {
  usePageTitle('Projects');
  const { setBreadcrumbs } = useBreadcrumbs();
  const user = useSelector((state: RootState) => state.auth.user);
  const canExport = hasPermission(user, 'export_project');
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  React.useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Projects', path: '/projects/list', icon: <BusinessIcon fontSize="small" /> },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Choices
  const { data: choices } = useQuery({
    queryKey: ['project-choices'],
    queryFn: () => projectsApi.choices(),
    staleTime: 10 * 60 * 1000,
  });

  // List
  const { data, isLoading } = useQuery({
    queryKey: ['projects', page, pageSize, search, fromDate, toDate],
    queryFn: () => projectsApi.list({
      page: page + 1,
      page_size: pageSize,
      search: search || undefined,
      from_date: fromDate || undefined,
      to_date: toDate || undefined,
    }),
    staleTime: 0,
  });

  const rows: Project[] = data?.results || [];
  const total = data?.count || 0;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectsApi.remove(id),
    onSuccess: () => {
      success('Project deleted');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setDeleteId(null);
    },
    onError: (err: any) => {
      toastError(err.response?.data?.message || 'Delete failed');
    },
  });

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      const params: any = {
        export_type: format,
        search: search || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      };
      const response = await apiClient.get('/api/masters/projects/export/', {
        params,
        responseType: 'blob',
      });
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Project_Report.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      toastError(`Failed to export as ${format.toUpperCase()}`);
    }
  };

  const handleOpenCreate = () => {
    navigate('/projects/add');
  };

  const handleOpenEdit = (proj: Project) => {
    navigate(`/projects/edit/${proj.id}`);
  };

  const columns: GridColDef<Project>[] = [
    { field: 'code', headerName: 'Code', width: 100 },
    { field: 'name', headerName: 'Project Name', flex: 1, minWidth: 160 },
    { field: 'developer_name', headerName: 'Developer', width: 150,
      valueGetter: (_: any, row: Project) => row.developer_name || '-',
    },
    { field: 'location', headerName: 'Location', width: 150,
      valueGetter: (_: any, row: Project) => row.location || '-',
    },
    { field: 'project_type', headerName: 'Type', width: 130, headerAlign: 'center', align: 'center',
      renderCell: (p) => {
        const typeColors: Record<string, 'default' | 'success' | 'primary' | 'secondary' | 'warning'> = {
          PLOT: 'success', FLAT: 'primary', VILLA: 'secondary', MIXED: 'warning',
        };
        return (
          <Select
            value={p.row.project_type || ''}
            size="small"
            variant="outlined"
            IconComponent={() => null}
            sx={{
              height: 32,
              '& .MuiSelect-select': { py: 0.5, pr: '8px !important', display: 'flex', alignItems: 'center', justifyContent: 'center' },
              '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
              '&:hover .MuiOutlinedInput-notchedOutline': { border: 'none' },
            }}
            onChange={async (e) => {
              try {
                await projectsApi.patch(p.row.id, { project_type: e.target.value });
                success('Type updated');
                queryClient.invalidateQueries({ queryKey: ['projects'] });
              } catch { toastError('Failed to update type'); }
            }}
            renderValue={(value) => (
              <Chip label={choices?.project_types?.find((c) => c.value === value)?.label || value} color={typeColors[value as string] || 'default'} size="small" />
            )}
          >
            {(choices?.project_types || []).map((c) => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
          </Select>
        );
      },
    },
    { field: 'approval_type', headerName: 'Approval', width: 110, headerAlign: 'center', align: 'center',
      valueGetter: (_: any, row: Project) => row.approval_type_display || row.approval_type || '-',
    },
    { field: 'status', headerName: 'Status', width: 140, headerAlign: 'center', align: 'center',
      renderCell: (p) => {
        const statusColors: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
          UPCOMING: 'info', ACTIVE: 'success', COMPLETED: 'warning', SOLD_OUT: 'error',
        };
        return (
          <Select
            value={p.row.status || ''}
            size="small"
            variant="outlined"
            IconComponent={() => null}
            sx={{
              height: 32,
              '& .MuiSelect-select': { py: 0.5, pr: '8px !important', display: 'flex', alignItems: 'center', justifyContent: 'center' },
              '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
              '&:hover .MuiOutlinedInput-notchedOutline': { border: 'none' },
            }}
            onChange={async (e) => {
              try {
                await projectsApi.patch(p.row.id, { status: e.target.value });
                success('Status updated');
                queryClient.invalidateQueries({ queryKey: ['projects'] });
              } catch { toastError('Failed to update status'); }
            }}
            renderValue={(value) => (
              <Chip label={choices?.project_statuses?.find((c) => c.value === value)?.label || value} color={statusColors[value as string] || 'default'} size="small" />
            )}
          >
            {(choices?.project_statuses || []).map((c) => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
          </Select>
        );
      },
    },
    {
      field: 'actions', headerName: 'Actions', width: 120, sortable: false, filterable: false, headerAlign: 'center', align: 'center',
      renderCell: (p) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, height: '100%' }}>
          <Tooltip title="View">
            <IconButton size="small" onClick={() => navigate(`/projects/view/${p.row.id}`)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => handleOpenEdit(p.row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => setDeleteId(p.row.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: 2 }}>
      <ScreenHeader
        title="Projects"
        showAddButton
        addButtonText="New Project"
        onAdd={handleOpenCreate}
      />

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            label="Search"
            placeholder="Name / code / developer / location"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            sx={{ width: 300 }}
          />
          <TextField
            size="small"
            type="date"
            label="From Date"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPage(0); }}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 160 }}
          />
          <TextField
            size="small"
            type="date"
            label="To Date"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setPage(0); }}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 160 }}
          />
          {(search || fromDate || toDate) && (
            <Button size="small" variant="text" onClick={() => { setSearch(''); setFromDate(''); setToDate(''); setPage(0); }}>
              Clear Filters
            </Button>
          )}
          {canExport && (
            <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
              <Button size="small" variant="outlined" startIcon={<ExcelIcon />} onClick={() => handleExport('excel')}>
                Excel
              </Button>
              <Button size="small" variant="outlined" startIcon={<PdfIcon />} onClick={() => handleExport('pdf')}>
                PDF
              </Button>
            </Box>
          )}
        </Box>
      </Paper>

      <Paper sx={{ height: 620 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={isLoading}
          rowHeight={52}
          paginationMode="server"
          rowCount={total}
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(model) => {
            setPage(model.page);
            setPageSize(model.pageSize);
          }}
          pageSizeOptions={[10, 20, 50, 100]}
          disableRowSelectionOnClick
        />
      </Paper>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Project?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        severity="error"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
};

export default ProjectList;