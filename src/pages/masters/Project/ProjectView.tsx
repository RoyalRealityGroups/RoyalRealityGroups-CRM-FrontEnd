import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Paper, Grid, Typography, Chip, Button, Divider,
  CircularProgress, Alert, Tabs, Tab, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Select, MenuItem, InputLabel, FormControl,
  IconButton, Tooltip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/GetApp';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../../../api/projects';
import { inventoryApi } from '../../../api/inventory';
import { documentApi } from '../../../api/document';
import { usePageTitle } from '../../../hooks';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { useToast } from '../../../contexts/ToastContext';
import ScreenHeader from '../../../components/common/ScreenHeader';
import type { Project } from '../../../types/project.types';
import type { PlotInventory, FlatInventory, Document } from '../../../types/realestate.types';
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
  const [openPlotDialog, setOpenPlotDialog] = useState(false);
  const [openFlatDialog, setOpenFlatDialog] = useState(false);
  const [openDocDialog, setOpenDocDialog] = useState(false);

  // Form states
  const [plotNumber, setPlotNumber] = useState('');
  const [plotAreaYd, setPlotAreaYd] = useState(0);
  const [plotAreaFt, setPlotAreaFt] = useState(0);
  const [plotFacing, setPlotFacing] = useState('EAST');
  const [plotRoadWidth, setPlotRoadWidth] = useState('');
  const [plotPriceYd, setPlotPriceYd] = useState(0);
  const [plotPriceTotal, setPlotPriceTotal] = useState(0);

  const [flatTower, setFlatTower] = useState('');
  const [flatFloor, setFlatFloor] = useState(0);
  const [flatUnitNumber, setFlatUnitNumber] = useState('');
  const [flatType, setFlatType] = useState('2BHK');
  const [flatAreaFt, setFlatAreaFt] = useState(0);
  const [flatPrice, setFlatPrice] = useState(0);
  const [flatFacing, setFlatFacing] = useState('EAST');

  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('BROCHURE');
  const [docFile, setDocFile] = useState<File | null>(null);

  React.useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Masters', path: '/masters' },
      { label: 'Projects', path: '/masters/projects', icon: <BusinessIcon fontSize="small" /> },
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

  // Plot inventory query
  const { data: plotsData, isLoading: loadingPlots } = useQuery({
    queryKey: ['project-plots', id],
    queryFn: () => inventoryApi.getPlots({ project: id, page_size: 1000 }),
    enabled: !!id && activeTab === 1 && project?.project_type !== 'FLAT',
  });

  // Flat inventory query
  const { data: flatsData, isLoading: loadingFlats } = useQuery({
    queryKey: ['project-flats', id],
    queryFn: () => inventoryApi.getFlats({ project: id, page_size: 1000 }),
    enabled: !!id && ((activeTab === 1 && project?.project_type === 'FLAT') || (activeTab === 2 && project?.project_type === 'MIXED')),
  });

  // Documents query
  const { data: docsData, isLoading: loadingDocs } = useQuery({
    queryKey: ['project-docs', id],
    queryFn: () => documentApi.getDocuments({ project: id, page_size: 1000 }),
    enabled: !!id && ((activeTab === 2 && project?.project_type !== 'MIXED') || (activeTab === 3 && project?.project_type === 'MIXED')),
  });

  // Plot Mutation
  const createPlotMutation = useMutation({
    mutationFn: (data: any) => inventoryApi.createPlot(data),
    onSuccess: () => {
      toastSuccess('Plot inventory added successfully');
      setOpenPlotDialog(false);
      queryClient.invalidateQueries({ queryKey: ['project-plots', id] });
      setPlotNumber('');
      setPlotAreaYd(0);
      setPlotAreaFt(0);
      setPlotPriceTotal(0);
    },
    onError: () => {
      toastError('Failed to add plot');
    }
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

  // Document Mutation
  const uploadDocMutation = useMutation({
    mutationFn: (data: any) => documentApi.createDocument(data),
    onSuccess: () => {
      toastSuccess('Document uploaded successfully');
      setOpenDocDialog(false);
      queryClient.invalidateQueries({ queryKey: ['project-docs', id] });
      setDocTitle('');
      setDocFile(null);
    },
    onError: () => {
      toastError('Failed to upload document');
    }
  });

  const deleteDocMutation = useMutation({
    mutationFn: (docId: string) => documentApi.deleteDocument(docId),
    onSuccess: () => {
      toastSuccess('Document deleted');
      queryClient.invalidateQueries({ queryKey: ['project-docs', id] });
    },
    onError: () => {
      toastError('Failed to delete document');
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
  const isPlot = project.project_type === 'PLOT' || project.project_type === 'VILLA';
  const isFlat = project.project_type === 'FLAT';
  const isMixed = project.project_type === 'MIXED';

  const tabLabels = ['General'];
  if (isPlot) {
    tabLabels.push('Plot Inventory', 'Documents');
  } else if (isFlat) {
    tabLabels.push('Flat Inventory', 'Documents');
  } else if (isMixed) {
    tabLabels.push('Plot Inventory', 'Flat Inventory', 'Documents');
  }

  // Columns configurations
  const plotColumns: GridColDef<PlotInventory>[] = [
    { field: 'plot_number', headerName: 'Plot Number', width: 130 },
    { field: 'area_sqyd', headerName: 'Area (SqYd)', type: 'number', width: 120 },
    { field: 'area_sqft', headerName: 'Area (SqFt)', type: 'number', width: 120 },
    { field: 'facing', headerName: 'Facing', width: 100 },
    { field: 'road_width', headerName: 'Road Width', width: 120 },
    {
      field: 'total_price',
      headerName: 'Total Price',
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

  const flatColumns: GridColDef<FlatInventory>[] = [
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

  const docColumns: GridColDef<Document>[] = [
    { field: 'title', headerName: 'Title', flex: 1 },
    { field: 'document_type', headerName: 'Document Type', width: 150 },
    {
      field: 'is_public',
      headerName: 'Visibility',
      width: 120,
      renderCell: (params) => (
        <Chip label={params.value ? 'Public' : 'Private'} color={params.value ? 'success' : 'default'} size="small" />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        <Box>
          {params.row.file && (
            <Tooltip title="Download">
              <IconButton href={params.row.file} target="_blank" size="small" color="primary">
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Delete">
            <IconButton onClick={() => deleteDocMutation.mutate(params.row.id)} size="small" color="error">
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
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
              <Button startIcon={<ArrowBackIcon />} sx={{ mr: 1 }} onClick={() => navigate('/masters/projects')}>
                Back
              </Button>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => navigate(`/masters/projects/${project.id}/edit`)}
              >
                Edit
              </Button>
            </Box>
          </Box>

          {project.image_url && (
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <img
                src={project.image_url}
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
              <Field label="RERA Number" value={project.rera_number} />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" gutterBottom>Classification</Typography>
              <Field label="Project Type" value={project.project_type_display || project.project_type} />
              <Field label="Approval Type" value={project.approval_type_display || project.approval_type} />
              <Field label="Total Area" value={project.total_area} />
              <Field label="Location" value={project.location_name} />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" gutterBottom>Timeline</Typography>
              <Field
                label="Launch Date"
                value={project.launch_date ? new Date(project.launch_date).toLocaleDateString() : null}
              />
              <Field
                label="Possession Date"
                value={project.possession_date ? new Date(project.possession_date).toLocaleDateString() : null}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" gutterBottom>Address</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                {project.address || '—'}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Plot Inventory Tab */}
      {activeTab === 1 && !isFlat && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Plot Layout Units</Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setOpenPlotDialog(true)}
            >
              Add Plot
            </Button>
          </Box>
          <Box sx={{ height: 400 }}>
            <DataGrid
              rows={plotsData?.results || []}
              columns={plotColumns}
              loading={loadingPlots}
              sx={getDataGridStyles()}
            />
          </Box>
        </Paper>
      )}

      {/* Flat Inventory Tab */}
      {((activeTab === 1 && isFlat) || (activeTab === 2 && isMixed)) && (
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

      {/* Documents Tab */}
      {((activeTab === 2 && !isMixed) || (activeTab === 3 && isMixed)) && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Project Blueprints, Brochures and Approvals</Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<UploadIcon />}
              onClick={() => setOpenDocDialog(true)}
            >
              Upload Document
            </Button>
          </Box>
          <Box sx={{ height: 400 }}>
            <DataGrid
              rows={docsData?.results || []}
              columns={docColumns}
              loading={loadingDocs}
              sx={getDataGridStyles()}
            />
          </Box>
        </Paper>
      )}

      {/* Plot Dialog */}
      <Dialog open={openPlotDialog} onClose={() => setOpenPlotDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Plot Inventory</DialogTitle>
        <form onSubmit={(e) => {
          e.preventDefault();
          createPlotMutation.mutate({
            project: id,
            plot_number: plotNumber,
            area_sqyd: plotAreaYd,
            area_sqft: plotAreaFt,
            facing: plotFacing,
            road_width: plotRoadWidth,
            total_price: plotPriceTotal,
            status: 'AVAILABLE'
          });
        }}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField required fullWidth size="small" label="Plot Number" value={plotNumber} onChange={(e) => setPlotNumber(e.target.value)} />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField type="number" fullWidth size="small" label="Area (SqYd)" value={plotAreaYd} onChange={(e) => setPlotAreaYd(Number(e.target.value))} />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField type="number" fullWidth size="small" label="Area (SqFt)" value={plotAreaFt} onChange={(e) => setPlotAreaFt(Number(e.target.value))} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Facing</InputLabel>
                  <Select value={plotFacing} label="Facing" onChange={(e) => setPlotFacing(e.target.value)}>
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
                <TextField fullWidth size="small" label="Road Width" value={plotRoadWidth} onChange={(e) => setPlotRoadWidth(e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField type="number" fullWidth size="small" label="Total Price (₹)" value={plotPriceTotal} onChange={(e) => setPlotPriceTotal(Number(e.target.value))} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenPlotDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" loading={createPlotMutation.isPending}>Add Plot</Button>
          </DialogActions>
        </form>
      </Dialog>

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

      {/* Doc Dialog */}
      <Dialog open={openDocDialog} onClose={() => setOpenDocDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Upload Blueprint / Asset File</DialogTitle>
        <form onSubmit={(e) => {
          e.preventDefault();
          if (!docTitle || !docFile) {
            toastError('Please specify title and file');
            return;
          }
          uploadDocMutation.mutate({
            title: docTitle,
            document_type: docType,
            file: docFile,
            linked_to: 'PROJECT',
            project: id
          });
        }}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField required fullWidth size="small" label="Document Title" value={docTitle} onChange={(e) => setDocTitle(e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Document Type</InputLabel>
                  <Select value={docType} label="Document Type" onChange={(e) => setDocType(e.target.value)}>
                    <MenuItem value="BROCHURE">Brochure</MenuItem>
                    <MenuItem value="LAYOUT_PLAN">Layout Plan</MenuItem>
                    <MenuItem value="FLOOR_PLAN">Floor Plan</MenuItem>
                    <MenuItem value="APPROVAL_DOC">Approval Document</MenuItem>
                    <MenuItem value="PHOTO">Photo</MenuItem>
                    <MenuItem value="OTHER">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <input type="file" required onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setDocFile(e.target.files[0]);
                  }
                }} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDocDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" loading={uploadDocMutation.isPending}>Upload</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default ProjectView;