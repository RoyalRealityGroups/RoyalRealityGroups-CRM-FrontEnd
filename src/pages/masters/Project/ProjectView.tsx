import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Paper, Grid, Typography, Chip, Button, Divider,
  CircularProgress, Alert, Tabs, Tab, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Select, MenuItem, InputLabel, FormControl,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../../../api/projects';
import { inventoryApi } from '../../../api/inventory.api';
import { usePageTitle } from '../../../hooks';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { useToast } from '../../../contexts/ToastContext';
import ScreenHeader from '../../../components/common/ScreenHeader';
import type { Project } from '../../../types/project.types';
import type { Flat } from '../../../types/inventory.types';
import HomeIcon from '@mui/icons-material/Home';
import BusinessIcon from '@mui/icons-material/Business';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { getDataGridStyles } from '../../../utils/spacing';

const Field: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <Box sx={{ mb: 2 }}>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Box sx={{ mt: 0.5 }}>
      {value ?? <Typography variant="body2" color="text.disabled">—</Typography>}
    </Box>
  </Box>
);

const statusColor = (s: string): any =>
  s === 'ACTIVE' ? 'success' :
  s === 'UPCOMING' ? 'info' :
  s === 'COMPLETED' ? 'default' :
  s === 'SOLD_OUT' ? 'warning' : 'default';

const inventoryStatusColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  AVAILABLE: 'success',
  BLOCKED: 'warning',
  BOOKED: 'primary',
  REGISTERED: 'info',
};

const ProjectView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();
  const queryClient = useQueryClient();
  usePageTitle('Project Details');

  const [activeTab, setActiveTab] = useState(0);

  // Dialog states for dynamic inventory creation
  const [openFlatDialog, setOpenFlatDialog] = useState(false);

  // Form states
  const [flatTower, setFlatTower] = useState('');
  const [flatFloor, setFlatFloor] = useState(0);
  const [flatUnitNumber, setFlatUnitNumber] = useState('');
  const [flatType, setFlatType] = useState('2BHK');
  const [flatAreaFt, setFlatAreaFt] = useState(0);
  const [flatPrice, setFlatPrice] = useState(0);
  const [flatFacing, setFlatFacing] = useState('EAST');

  React.useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Masters', path: '/masters' },
      { label: 'Projects', path: '/projects/list', icon: <BusinessIcon fontSize="small" /> },
      { label: 'Details' },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  // Project details query
  const { data: project, isLoading, isError, error } = useQuery<Project>({
    queryKey: ['project', id],
    queryFn: () => projectsApi.get(id!),
    enabled: !!id,
  });

  // Flat inventory query
  const { data: flatsData, isLoading: loadingFlats } = useQuery({
    queryKey: ['project-flats', id],
    queryFn: () => inventoryApi.getFlats({ project: id, page_size: 1000 }),
    enabled: !!id && activeTab === 1,
  });

  // Flat Mutation
  const createFlatMutation = useMutation({
    mutationFn: (data: any) => inventoryApi.createFlat(data),
    onSuccess: () => {
      toastSuccess('Flat unit added successfully');
      setOpenFlatDialog(false);
      queryClient.invalidateQueries({ queryKey: ['project-flats', id] });
      setFlatUnitNumber('');
      setFlatFloor(0);
      setFlatTower('');
      setFlatPrice(0);
    },
    onError: () => {
      toastError('Failed to add flat');
    }
  });

  if (isLoading) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !project) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">
          {(error as any)?.response?.data?.detail || 'Project not found'}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} sx={{ mt: 2 }} onClick={() => navigate(-1)}>
          Back
        </Button>
      </Box>
    );
  }

  // Define tab headers dynamically based on project type
  const isFlat = project.project_type === 'FLAT';
  const isMixed = project.project_type === 'MIXED';

  const tabLabels = ['General'];
  if (isFlat || isMixed) tabLabels.push('Flat Inventory');

  // Columns configurations
  const flatColumns: GridColDef<Flat>[] = [
    { field: 'tower', headerName: 'Tower / Block', width: 130 },
    { field: 'floor', headerName: 'Floor', type: 'number', width: 90 },
    { field: 'unit_number', headerName: 'Unit Number', width: 130 },
    { field: 'flat_type', headerName: 'Flat Type', width: 110 },
    { field: 'area_sqft', headerName: 'Area (SqFt)', type: 'number', width: 120 },
    { field: 'facing', headerName: 'Facing', width: 100 },
    {
      field: 'price',
      headerName: 'Price',
      width: 140,
      valueFormatter: (value) => value ? `₹${Number(value).toLocaleString()}` : '—',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={inventoryStatusColors[params.value] || 'default'}
          size="small"
        />
      ),
    },
  ];

  return (
    <Box sx={{ p: 2 }}>
      <ScreenHeader
        title={project.name}
      />

      <Paper sx={{ mb: 2 }}>
        <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
          {tabLabels.map((lbl, idx) => (
            <Tab key={idx} label={lbl} />
          ))}
        </Tabs>
      </Paper>

      {/* Tab 0: General Info */}
      {activeTab === 0 && (
        <Paper sx={{ p: 3, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Chip
                label={project.status_display || project.status}
                color={statusColor(project.status)}
                size="small"
              />
              {project.is_deleted && <Chip label="Deleted" color="error" size="small" />}
              {!project.is_active && <Chip label="Inactive" size="small" />}
            </Box>
            <Box>
              <Button startIcon={<ArrowBackIcon />} sx={{ mr: 1 }} onClick={() => navigate('/projects/list')}>
                Back
              </Button>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => navigate(`/projects/edit/${project.id}`)}
              >
                Edit
              </Button>
            </Box>
          </Box>

          {project.sub && (
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <img
                src={typeof project.sub === 'string' ? project.sub : undefined}
                alt={project.name}
                style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 4 }}
              />
            </Box>
          )}

          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" gutterBottom>Identification</Typography>
              <Field label="Project Code" value={project.code} />
              <Field label="Project Name" value={project.name} />
              <Field label="Developer" value={project.developer_name} />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" gutterBottom>Classification</Typography>
              <Field label="Project Type" value={project.project_type_display || project.project_type} />
              <Field label="Approval Type" value={project.approval_type_display || project.approval_type} />
              <Field label="Location" value={project.location} />
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Flat Inventory Tab */}
      {activeTab === 1 && (isFlat || isMixed) && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Apartment Units / Flats</Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setOpenFlatDialog(true)}
            >
              Add Flat Unit
            </Button>
          </Box>
          <Box sx={{ height: 400 }}>
            <DataGrid
              rows={flatsData?.results || []}
              columns={flatColumns}
              loading={loadingFlats}
              sx={getDataGridStyles()}
            />
          </Box>
        </Paper>
      )}

      {/* Flat Dialog */}
      <Dialog open={openFlatDialog} onClose={() => setOpenFlatDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Flat / Apartment Unit</DialogTitle>
        <form onSubmit={(e) => {
          e.preventDefault();
          createFlatMutation.mutate({
            project: id,
            tower: flatTower,
            floor: flatFloor,
            unit_number: flatUnitNumber,
            flat_type: flatType,
            area_sqft: flatAreaFt,
            facing: flatFacing,
            price: flatPrice,
            status: 'AVAILABLE'
          });
        }}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth size="small" label="Tower Name/Block" value={flatTower} onChange={(e) => setFlatTower(e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField type="number" fullWidth size="small" label="Floor" value={flatFloor} onChange={(e) => setFlatFloor(Number(e.target.value))} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField required fullWidth size="small" label="Unit / Flat Number" value={flatUnitNumber} onChange={(e) => setFlatUnitNumber(e.target.value)} />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField fullWidth size="small" label="Type (e.g. 2BHK)" value={flatType} onChange={(e) => setFlatType(e.target.value)} />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField type="number" fullWidth size="small" label="Area (SqFt)" value={flatAreaFt} onChange={(e) => setFlatAreaFt(Number(e.target.value))} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Facing</InputLabel>
                  <Select value={flatFacing} label="Facing" onChange={(e) => setFlatFacing(e.target.value)}>
                    <MenuItem value="EAST">East</MenuItem>
                    <MenuItem value="WEST">West</MenuItem>
                    <MenuItem value="NORTH">North</MenuItem>
                    <MenuItem value="SOUTH">South</MenuItem>
                    <MenuItem value="NE">North East</MenuItem>
                    <MenuItem value="NW">North West</MenuItem>
                    <MenuItem value="SE">South East</MenuItem>
                    <MenuItem value="SW">South West</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField type="number" fullWidth size="small" label="Price (₹)" value={flatPrice} onChange={(e) => setFlatPrice(Number(e.target.value))} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenFlatDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" loading={createFlatMutation.isPending}>Add Flat</Button>
          </DialogActions>
        </form>
      </Dialog>


    </Box>
  );
};

export default ProjectView;