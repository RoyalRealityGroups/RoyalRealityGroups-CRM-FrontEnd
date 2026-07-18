import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Typography,
  Card,
  CardMedia,
  Divider,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  CheckCircle as ConfirmIcon,
  Cancel as CancelIcon,
  CloudUpload as UploadIcon,
  PhotoCamera as CameraIcon,
  Home as HomeIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { siteVisitApi } from '../../api/sitevisit';
import { projectsApi } from '../../api/projects';
import { leadApi } from '../../api/lead.api';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks';
import ScreenHeader from '../../components/common/ScreenHeader';
import {
  getPageContainerStyles,
  getHeaderSectionStyles,
  getContentSectionStyles,
  getDataGridStyles,
} from '../../utils/spacing';
import type { SiteVisit, SiteVisitFormData } from '../../types/realestate.types';

const statusColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  SCHEDULED: 'info',
  CONFIRMED: 'primary',
  COMPLETED: 'success',
  CANCELLED: 'error',
};

const SiteVisits: React.FC = () => {
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();
  const queryClient = useQueryClient();
  usePageTitle('Site Visit Management');

  // Breadcrumbs
  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Lead Management', path: '/lead', icon: <PersonIcon fontSize="small" /> },
      { label: 'Site Visits' },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  // List States
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');

  // Dialog States
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<SiteVisit | null>(null);

  // Form States
  const [formData, setFormData] = useState<SiteVisitFormData>({
    lead: '',
    customer_name: '',
    customer_mobile: '',
    project: '',
    visit_date: '',
    visit_time: '',
    assigned_employee: '',
    status: 'SCHEDULED',
  });

  const [feedback, setFeedback] = useState('');
  const [remarks, setRemarks] = useState('');
  const [photos, setPhotos] = useState<FileList | null>(null);
  const [photoCaption, setPhotoCaption] = useState('');

  // Queries
  const { data: visitsData, isLoading } = useQuery({
    queryKey: ['site-visits', paginationModel, searchQuery, statusFilter, projectFilter],
    queryFn: () =>
      siteVisitApi.getSiteVisits({
        page: paginationModel.page + 1,
        page_size: paginationModel.pageSize,
        search: searchQuery,
        status: statusFilter || undefined,
        project: projectFilter || undefined,
      }),
  });

  const { data: projects } = useQuery({
    queryKey: ['projects-mini'],
    queryFn: () => projectsApi.mini(),
  });

  const { data: leads } = useQuery({
    queryKey: ['leads-dropdown'],
    queryFn: () => leadApi.getLeads({ page_size: 100 }),
  });

  const { data: employees } = useQuery({
    queryKey: ['employees-dropdown'],
    queryFn: () => leadApi.getUsers(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: SiteVisitFormData) => siteVisitApi.createSiteVisit(data),
    onSuccess: () => {
      toastSuccess('Site visit scheduled successfully');
      setOpenAddDialog(false);
      queryClient.invalidateQueries({ queryKey: ['site-visits'] });
      resetForm();
    },
    onError: (err: any) => {
      toastError(err.response?.data?.detail || 'Failed to schedule site visit');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, feedback, remarks }: { id: string; status: string; feedback?: string; remarks?: string }) =>
      siteVisitApi.updateStatus(id, status, feedback, remarks),
    onSuccess: (data) => {
      toastSuccess(`Site visit marked as ${data.status.toLowerCase()}`);
      setSelectedVisit(data);
      queryClient.invalidateQueries({ queryKey: ['site-visits'] });
    },
    onError: (err: any) => {
      toastError(err.response?.data?.detail || 'Failed to update status');
    },
  });

  const uploadPhotosMutation = useMutation({
    mutationFn: ({ id, photos, caption }: { id: string; photos: File[]; caption?: string }) =>
      siteVisitApi.uploadPhotos(id, photos, caption),
    onSuccess: () => {
      toastSuccess('Photos uploaded successfully');
      setPhotos(null);
      setPhotoCaption('');
      queryClient.invalidateQueries({ queryKey: ['site-visits'] });
      // Refresh current visit
      if (selectedVisit) {
        siteVisitApi.getSiteVisit(selectedVisit.id).then(setSelectedVisit);
      }
    },
    onError: (err: any) => {
      toastError(err.response?.data?.detail || 'Failed to upload photos');
    },
  });

  const resetForm = () => {
    setFormData({
      lead: '',
      customer_name: '',
      customer_mobile: '',
      project: '',
      visit_date: '',
      visit_time: '',
      assigned_employee: '',
      status: 'SCHEDULED',
    });
  };

  const handleLeadChange = (leadId: string) => {
    const selectedLead = leads?.results?.find((l: any) => l.id === leadId);
    if (selectedLead) {
      setFormData(prev => ({
        ...prev,
        lead: leadId,
        customer_name: selectedLead.name,
        customer_mobile: selectedLead.mobile,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        lead: leadId,
      }));
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_name || !formData.visit_date || !formData.project) {
      toastError('Please fill required fields (Customer Name, Project, Visit Date)');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleUploadPhotos = () => {
    if (!selectedVisit || !photos || photos.length === 0) return;
    const fileList: File[] = [];
    for (let i = 0; i < photos.length; i++) {
      fileList.push(photos[i]);
    }
    uploadPhotosMutation.mutate({ id: selectedVisit.id, photos: fileList, caption: photoCaption });
  };

  const columns: GridColDef<SiteVisit>[] = [
    { field: 'code', headerName: 'Code', width: 120 },
    { field: 'customer_name', headerName: 'Customer Name', width: 160 },
    { field: 'customer_mobile', headerName: 'Mobile', width: 130 },
    {
      field: 'project_name',
      headerName: 'Project',
      width: 150,
      valueGetter: (_, row) => {
        if (typeof row.project === 'object' && row.project !== null) {
          return (row.project as any).name;
        }
        return row.project_name || row.project || '-';
      }
    },
    { field: 'visit_date', headerName: 'Visit Date', width: 120 },
    { field: 'visit_time', headerName: 'Visit Time', width: 100 },
    {
      field: 'assigned_employee_name',
      headerName: 'Assigned Exec',
      width: 150,
      valueGetter: (_, row) => {
        if (typeof row.assigned_employee === 'object' && row.assigned_employee !== null) {
          const emp = row.assigned_employee as any;
          return emp.first_name ? `${emp.first_name} ${emp.last_name || ''}` : emp.username;
        }
        return row.assigned_employee_name || '-';
      }
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={statusColors[params.value] || 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="View details">
            <IconButton
              onClick={() => {
                setSelectedVisit(params.row);
                setFeedback(params.row.customer_feedback || '');
                setRemarks(params.row.remarks || '');
                setOpenViewDialog(true);
              }}
              size="small"
              color="primary"
            >
              <ViewIcon />
            </IconButton>
          </Tooltip>
          {params.row.status === 'SCHEDULED' && (
            <>
              <Tooltip title="Confirm Visit">
                <IconButton
                  onClick={() => updateStatusMutation.mutate({ id: params.row.id, status: 'CONFIRMED' })}
                  size="small"
                  color="success"
                >
                  <ConfirmIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Cancel Visit">
                <IconButton
                  onClick={() => updateStatusMutation.mutate({ id: params.row.id, status: 'CANCELLED' })}
                  size="small"
                  color="error"
                >
                  <CancelIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box sx={getPageContainerStyles()}>
      <Box sx={getHeaderSectionStyles()}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <ScreenHeader title="Site Visit Tracker" subtitle="Schedule and manage property site visits for prospective leads" />
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => {
              resetForm();
              setOpenAddDialog(true);
            }}
          >
            Schedule Visit
          </Button>
        </Box>
      </Box>

      <Box sx={getContentSectionStyles()}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search Customer or Code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="SCHEDULED">Scheduled</MenuItem>
                <MenuItem value="CONFIRMED">Confirmed</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Project</InputLabel>
              <Select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                label="Project"
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
        </Grid>

        <Paper sx={{ height: 500, width: '100%' }}>
          <DataGrid
            rows={visitsData?.results || []}
            columns={columns}
            loading={isLoading}
            paginationMode="server"
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            rowCount={visitsData?.count || 0}
            pageSizeOptions={[10, 20, 50]}
            sx={getDataGridStyles()}
          />
        </Paper>
      </Box>

      {/* Schedule Visit Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule Site Visit</DialogTitle>
        <form onSubmit={handleCreate}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Link Lead (Optional)</InputLabel>
                  <Select
                    value={formData.lead || ''}
                    onChange={(e) => handleLeadChange(e.target.value)}
                    label="Link Lead (Optional)"
                  >
                    <MenuItem value="">-- Select Lead --</MenuItem>
                    {leads?.results?.map((l: any) => (
                      <MenuItem key={l.id} value={l.id}>
                        {l.name} ({l.code})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  size="small"
                  label="Customer Name"
                  value={formData.customer_name}
                  onChange={(e) => setFormData(p => ({ ...p, customer_name: e.target.value }))}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Mobile Number"
                  value={formData.customer_mobile}
                  onChange={(e) => setFormData(p => ({ ...p, customer_mobile: e.target.value }))}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth required size="small">
                  <InputLabel>Select Project</InputLabel>
                  <Select
                    value={formData.project || ''}
                    onChange={(e) => setFormData(p => ({ ...p, project: e.target.value }))}
                    label="Select Project"
                  >
                    {projects?.map((p) => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  type="date"
                  size="small"
                  label="Visit Date"
                  InputLabelProps={{ shrink: true }}
                  value={formData.visit_date}
                  onChange={(e) => setFormData(p => ({ ...p, visit_date: e.target.value }))}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="time"
                  size="small"
                  label="Visit Time"
                  InputLabelProps={{ shrink: true }}
                  value={formData.visit_time}
                  onChange={(e) => setFormData(p => ({ ...p, visit_time: e.target.value }))}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Assign Executive</InputLabel>
                  <Select
                    value={formData.assigned_employee || ''}
                    onChange={(e) => setFormData(p => ({ ...p, assigned_employee: e.target.value }))}
                    label="Assign Executive"
                  >
                    {employees?.map((emp: any) => (
                      <MenuItem key={emp.id} value={emp.id}>
                        {emp.first_name ? `${emp.first_name} ${emp.last_name || ''}` : emp.username}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
            <Button variant="contained" type="submit" loading={createMutation.isPending}>
              Schedule
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* View/Edit Visit Details Dialog */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
        {selectedVisit && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6">Site Visit Details: {selectedVisit.code}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Scheduled on {selectedVisit.visit_date} at {selectedVisit.visit_time || 'N/A'}
                </Typography>
              </Box>
              <Chip label={selectedVisit.status} color={statusColors[selectedVisit.status] || 'default'} />
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                {/* Details Section */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Customer Details
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedVisit.customer_name}</Typography>
                  <Typography variant="body2" color="text.secondary">Mobile: {selectedVisit.customer_mobile || '—'}</Typography>
                  <Box sx={{ mt: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Project Details
                  </Typography>
                  <Typography variant="body1">
                    {typeof selectedVisit.project === 'object' && selectedVisit.project !== null
                      ? (selectedVisit.project as any).name
                      : selectedVisit.project_name || '—'}
                  </Typography>
                  <Box sx={{ mt: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Assigned Executive
                  </Typography>
                  <Typography variant="body1">
                    {typeof selectedVisit.assigned_employee === 'object' && selectedVisit.assigned_employee !== null
                      ? `${(selectedVisit.assigned_employee as any).first_name || ''} ${(selectedVisit.assigned_employee as any).last_name || ''}`.trim() || (selectedVisit.assigned_employee as any).username
                      : selectedVisit.assigned_employee_name || '—'}
                  </Typography>
                </Grid>

                {/* Feedback / Completion Section */}
                <Grid size={{ xs: 12, md: 6 }}>
                  {selectedVisit.status !== 'COMPLETED' && selectedVisit.status !== 'CANCELLED' ? (
                    <Box sx={{ p: 2, border: '1px solid rgba(0, 0, 0, 0.1)', borderRadius: 2 }}>
                      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                        Actions & Completion Feedback
                      </Typography>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        size="small"
                        label="Customer Feedback"
                        placeholder="What did the customer think of the site?"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        sx={{ mb: 2, mt: 1 }}
                      />
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        size="small"
                        label="Staff Remarks"
                        placeholder="Internal staff remarks..."
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        sx={{ mb: 2 }}
                      />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          color="success"
                          fullWidth
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: selectedVisit.id,
                              status: 'COMPLETED',
                              feedback,
                              remarks,
                            })
                          }
                          loading={updateStatusMutation.isPending}
                        >
                          Complete Visit
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          fullWidth
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: selectedVisit.id,
                              status: 'CANCELLED',
                              remarks,
                            })
                          }
                          loading={updateStatusMutation.isPending}
                        >
                          Cancel Visit
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Customer Feedback
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-line', mb: 2 }}>
                        {selectedVisit.customer_feedback || 'No feedback recorded.'}
                      </Typography>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Internal Remarks
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                        {selectedVisit.remarks || 'No remarks recorded.'}
                      </Typography>
                    </Box>
                  )}
                </Grid>

                {/* Upload Photos Section (Shown for Completed visits) */}
                {selectedVisit.status === 'COMPLETED' && (
                  <Grid size={{ xs: 12 }}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                      Visit Photographs
                    </Typography>

                    {/* Uploader */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <Button
                        component="label"
                        variant="outlined"
                        startIcon={<CameraIcon />}
                      >
                        Select Photos
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          hidden
                          onChange={(e) => setPhotos(e.target.files)}
                        />
                      </Button>
                      {photos && (
                        <Typography variant="body2" color="text.secondary">
                          {photos.length} files selected
                        </Typography>
                      )}
                      {photos && (
                        <TextField
                          size="small"
                          placeholder="Photo Caption..."
                          value={photoCaption}
                          onChange={(e) => setPhotoCaption(e.target.value)}
                        />
                      )}
                      {photos && (
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<UploadIcon />}
                          onClick={handleUploadPhotos}
                          loading={uploadPhotosMutation.isPending}
                        >
                          Upload
                        </Button>
                      )}
                    </Box>

                    {/* Photos Grid */}
                    <Grid container spacing={2}>
                      {selectedVisit.photos && selectedVisit.photos.length > 0 ? (
                        selectedVisit.photos.map((photo) => (
                          <Grid size={{ xs: 6, sm: 4, md: 3 }} key={photo.id}>
                            <Card sx={{ maxWidth: 345 }}>
                              <CardMedia
                                component="img"
                                height="140"
                                image={photo.photo}
                                alt={photo.caption || 'Site visit photo'}
                              />
                              {photo.caption && (
                                <Box sx={{ p: 1 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    {photo.caption}
                                  </Typography>
                                </Box>
                              )}
                            </Card>
                          </Grid>
                        ))
                      ) : (
                        <Grid size={{ xs: 12 }}>
                          <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 2 }}>
                            No photographs attached to this site visit.
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenViewDialog(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default SiteVisits;
