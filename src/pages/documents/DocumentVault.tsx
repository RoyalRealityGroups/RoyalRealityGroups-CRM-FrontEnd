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
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import {
  Search as SearchIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  GetApp as DownloadIcon,
  FolderOpen as FolderIcon,
  Home as HomeIcon,
  FilePresent as FileIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentApi } from '../../api/document';
import { projectsApi } from '../../api/projects';
import { leadApi } from '../../api/lead.api';
import { bookingApi } from '../../api/booking';
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
import type { Document } from '../../types/realestate.types';

const documentTypes = [
  { value: 'BROCHURE', label: 'Brochure' },
  { value: 'LAYOUT_PLAN', label: 'Layout Plan' },
  { value: 'FLOOR_PLAN', label: 'Floor Plan' },
  { value: 'APPROVAL_DOC', label: 'Approval Document' },
  { value: 'CUSTOMER_KYC', label: 'Customer KYC' },
  { value: 'BOOKING_FORM', label: 'Booking Form' },
  { value: 'AGREEMENT', label: 'Agreement' },
  { value: 'PHOTO', label: 'Photo' },
  { value: 'OTHER', label: 'Other' },
];

const DocumentVault: React.FC = () => {
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();
  const queryClient = useQueryClient();
  usePageTitle('Document Vault');

  // Breadcrumbs
  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Document Vault' },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  // List States
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  // Dialog States
  const [openUploadDialog, setOpenUploadDialog] = useState(false);

  // Form States
  const [title, setTitle] = useState('');
  const [documentType, setDocumentType] = useState('OTHER');
  const [description, setDescription] = useState('');
  const [linkedTo, setLinkedTo] = useState<'PROJECT' | 'LEAD' | 'BOOKING'>('PROJECT');
  const [linkedId, setLinkedId] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  // Queries
  const { data: docsData, isLoading } = useQuery({
    queryKey: ['documents', paginationModel, searchQuery, typeFilter, entityFilter],
    queryFn: () =>
      documentApi.getDocuments({
        page: paginationModel.page + 1,
        page_size: paginationModel.pageSize,
        search: searchQuery,
        document_type: typeFilter || undefined,
        linked_to: entityFilter || undefined,
      }),
  });

  const { data: projects } = useQuery({
    queryKey: ['projects-dropdown'],
    queryFn: () => projectsApi.mini(),
    enabled: openUploadDialog && linkedTo === 'PROJECT',
  });

  const { data: leads } = useQuery({
    queryKey: ['leads-dropdown'],
    queryFn: () => leadApi.getLeads({ page_size: 100 }),
    enabled: openUploadDialog && linkedTo === 'LEAD',
  });

  const { data: bookings } = useQuery({
    queryKey: ['bookings-dropdown'],
    queryFn: () => bookingApi.getBookings({ page_size: 100 }),
    enabled: openUploadDialog && linkedTo === 'BOOKING',
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => documentApi.createDocument(data),
    onSuccess: () => {
      toastSuccess('Document uploaded successfully');
      setOpenUploadDialog(false);
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      resetForm();
    },
    onError: (err: any) => {
      toastError(err.response?.data?.detail || 'Failed to upload document');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentApi.deleteDocument(id),
    onSuccess: () => {
      toastSuccess('Document deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (err: any) => {
      toastError(err.response?.data?.detail || 'Failed to delete document');
    },
  });

  const resetForm = () => {
    setTitle('');
    setDocumentType('OTHER');
    setDescription('');
    setLinkedTo('PROJECT');
    setLinkedId('');
    setIsPublic(false);
    setFile(null);
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !file) {
      toastError('Please fill required fields (Title, File)');
      return;
    }

    const payload: any = {
      title,
      document_type: documentType,
      description,
      file,
      linked_to: linkedTo,
      is_public: isPublic,
    };

    if (linkedTo === 'PROJECT') payload.project = linkedId;
    if (linkedTo === 'LEAD') payload.lead = linkedId;
    if (linkedTo === 'BOOKING') payload.booking = linkedId;

    createMutation.mutate(payload);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '—';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const columns: GridColDef<Document>[] = [
    { field: 'code', headerName: 'Code', width: 120 },
    { field: 'title', headerName: 'Title', width: 180 },
    {
      field: 'document_type',
      headerName: 'Type',
      width: 140,
      valueGetter: (value) => documentTypes.find(t => t.value === value)?.label || value,
    },
    { field: 'linked_to', headerName: 'Linked Entity', width: 120 },
    {
      field: 'linked_item',
      headerName: 'Linked Target',
      width: 160,
      valueGetter: (_, row) => {
        if (row.project) return `Project: ${row.project}`;
        if (row.lead) return `Lead: ${row.lead}`;
        if (row.booking) return `Booking: ${row.booking}`;
        return '—';
      }
    },
    {
      field: 'file_size',
      headerName: 'Size',
      width: 110,
      valueFormatter: (value) => value ? formatFileSize(value) : '—',
    },
    {
      field: 'is_public',
      headerName: 'Public?',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Public' : 'Private'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          {params.row.file && (
            <Tooltip title="Download File">
              <IconButton
                href={params.row.file}
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                color="primary"
              >
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Delete Document">
            <IconButton
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this document?')) {
                  deleteMutation.mutate(params.row.id);
                }
              }}
              size="small"
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={getPageContainerStyles()}>
      <Box sx={getHeaderSectionStyles()}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <ScreenHeader title="Document Vault" subtitle="Upload and manage customer KYC files, blueprints, and brochures" />
          <Button
            variant="contained"
            color="primary"
            startIcon={<UploadIcon />}
            onClick={() => {
              resetForm();
              setOpenUploadDialog(true);
            }}
          >
            Upload File
          </Button>
        </Box>
      </Box>

      <Box sx={getContentSectionStyles()}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search Title or Code..."
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
              <InputLabel>Document Type</InputLabel>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                label="Document Type"
              >
                <MenuItem value="">All Types</MenuItem>
                {documentTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Linked To</InputLabel>
              <Select
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                label="Linked To"
              >
                <MenuItem value="">All Entities</MenuItem>
                <MenuItem value="PROJECT">Project</MenuItem>
                <MenuItem value="LEAD">Lead</MenuItem>
                <MenuItem value="BOOKING">Booking</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Paper sx={{ height: 500, width: '100%' }}>
          <DataGrid
            rows={docsData?.results || []}
            columns={columns}
            loading={isLoading}
            paginationMode="server"
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            rowCount={docsData?.count || 0}
            pageSizeOptions={[10, 20, 50]}
            sx={getDataGridStyles()}
          />
        </Paper>
      </Box>

      {/* Upload Dialog */}
      <Dialog open={openUploadDialog} onClose={() => setOpenUploadDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Document</DialogTitle>
        <form onSubmit={handleUpload}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  required
                  size="small"
                  label="Document Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Document Type</InputLabel>
                  <Select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    label="Document Type"
                  >
                    {documentTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Link To Entity</InputLabel>
                  <Select
                    value={linkedTo}
                    onChange={(e) => {
                      setLinkedTo(e.target.value as 'PROJECT' | 'LEAD' | 'BOOKING');
                      setLinkedId('');
                    }}
                    label="Link To Entity"
                  >
                    <MenuItem value="PROJECT">Project</MenuItem>
                    <MenuItem value="LEAD">Lead</MenuItem>
                    <MenuItem value="BOOKING">Booking</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Dynamic Entity Target Selectors */}
              <Grid size={{ xs: 12 }}>
                {linkedTo === 'PROJECT' && (
                  <FormControl fullWidth size="small">
                    <InputLabel>Select Project</InputLabel>
                    <Select
                      value={linkedId}
                      onChange={(e) => setLinkedId(e.target.value)}
                      label="Select Project"
                    >
                      <MenuItem value="">-- Select Project --</MenuItem>
                      {projects?.map((proj) => (
                        <MenuItem key={proj.id} value={proj.id}>
                          {proj.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
                {linkedTo === 'LEAD' && (
                  <FormControl fullWidth size="small">
                    <InputLabel>Select Lead (Customer)</InputLabel>
                    <Select
                      value={linkedId}
                      onChange={(e) => setLinkedId(e.target.value)}
                      label="Select Lead (Customer)"
                    >
                      <MenuItem value="">-- Select Lead --</MenuItem>
                      {leads?.results?.map((l: any) => (
                        <MenuItem key={l.id} value={l.id}>
                          {l.name} ({l.code})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
                {linkedTo === 'BOOKING' && (
                  <FormControl fullWidth size="small">
                    <InputLabel>Select Booking</InputLabel>
                    <Select
                      value={linkedId}
                      onChange={(e) => setLinkedId(e.target.value)}
                      label="Select Booking"
                    >
                      <MenuItem value="">-- Select Booking --</MenuItem>
                      {bookings?.results?.map((b: any) => (
                        <MenuItem key={b.id} value={b.id}>
                          {b.code} - {b.customer_name} ({b.unit_number})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  label="Description"
                  placeholder="Optional brief description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Grid>

              <Grid size={{ xs: 12 }} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Select File (PDF, Images, Excel) *
                </Typography>
                <input
                  type="file"
                  required
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFile(e.target.files[0]);
                      if (!title) {
                        // Autofill title from filename without extension
                        const fname = e.target.files[0].name.split('.').slice(0, -1).join('.');
                        setTitle(fname);
                      }
                    }
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Mark as Public (Public brochures are visible on customer website)"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenUploadDialog(false)}>Cancel</Button>
            <Button variant="contained" type="submit" loading={createMutation.isPending}>
              Upload Document
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default DocumentVault;
