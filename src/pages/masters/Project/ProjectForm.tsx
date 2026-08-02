import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Paper, Grid, Button, TextField, CircularProgress, Typography, 
  IconButton, Chip, Card, CardContent, Divider, Dialog, DialogTitle,
  DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AddIcon from '@mui/icons-material/Add';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DescriptionIcon from '@mui/icons-material/Description';
import PoolIcon from '@mui/icons-material/Pool';
import SettingsIcon from '@mui/icons-material/Settings';
import GridViewIcon from '@mui/icons-material/GridView';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../../../api/projects';
import { useToast } from '../../../contexts/ToastContext';
import { usePageTitle } from '../../../hooks';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import type { Project, ProjectFormData, ProjectImage } from '../../../types/project.types';
import HomeIcon from '@mui/icons-material/Home';
import BusinessIcon from '@mui/icons-material/Business';

// Image Carousel for Edit mode
interface EditCarouselProps {
  existingImages: ProjectImage[];
  newPreviews: string[];
  onDeleteExisting: (id: string) => void;
  onDeleteNew: (index: number) => void;
  onAddImages: (files: File[]) => void;
}

const EditImageCarousel: React.FC<EditCarouselProps> = ({ 
  existingImages, newPreviews, onDeleteExisting, onDeleteNew, onAddImages 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const allImages = [
    ...existingImages.map(img => ({ type: 'existing' as const, id: img.id, src: img.image })),
    ...newPreviews.map((src, i) => ({ type: 'new' as const, id: `new-${i}`, src, index: i })),
  ];

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  }, [allImages.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  }, [allImages.length]);

  const handleDelete = () => {
    const img = allImages[currentIndex];
    if (img.type === 'existing') {
      onDeleteExisting(img.id);
    } else {
      onDeleteNew((img as any).index);
    }
    if (currentIndex >= allImages.length - 1 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (allImages.length === 0) {
    return (
      <Box
        component="label"
        sx={{
          height: { xs: 250, sm: 350, md: 400 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'grey.100',
          borderRadius: { xs: 2, md: 3 },
          cursor: 'pointer',
          transition: 'all 0.2s',
          '&:hover': { bgcolor: 'grey.200' },
        }}
      >
        <ImageIcon sx={{ fontSize: { xs: 48, md: 64 }, color: 'grey.400', mb: 2 }} />
        <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
          Click to upload elevation images
        </Typography>
        <Typography variant="caption" color="text.disabled">JPG, PNG, WebP (multiple)</Typography>
        <input
          type="file"
          hidden
          multiple
          accept="image/*"
          onChange={(e) => onAddImages(Array.from(e.target.files || []))}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Main Image */}
      <Box
        sx={{
          position: 'relative',
          height: { xs: 250, sm: 350, md: 400 },
          borderRadius: { xs: 2, md: 3 },
          overflow: 'hidden',
          bgcolor: 'grey.900',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={currentIndex}
            src={allImages[currentIndex]?.src}
            alt={`Image ${currentIndex + 1}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setLightboxOpen(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
          />
        </AnimatePresence>

        {/* New badge */}
        {allImages[currentIndex]?.type === 'new' && (
          <Chip
            label="New - will upload on save"
            size="small"
            color="success"
            sx={{ position: 'absolute', top: 12, left: 12 }}
          />
        )}

        {/* Navigation */}
        {allImages.length > 1 && (
          <>
            <IconButton
              onClick={goToPrevious}
              size="small"
              sx={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: 'white' } }}
            >
              <ChevronLeftIcon />
            </IconButton>
            <IconButton
              onClick={goToNext}
              size="small"
              sx={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: 'white' } }}
            >
              <ChevronRightIcon />
            </IconButton>
          </>
        )}

        {/* Bottom controls */}
        <Box sx={{ position: 'absolute', bottom: 12, left: 12, right: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              component="label"
              size="small"
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ bgcolor: 'rgba(255,255,255,0.9)', color: 'text.primary', '&:hover': { bgcolor: 'white' } }}
            >
              Add
              <input type="file" hidden multiple accept="image/*" onChange={(e) => onAddImages(Array.from(e.target.files || []))} />
            </Button>
            <Button
              size="small"
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
              sx={{ bgcolor: 'rgba(255,255,255,0.9)', color: 'error.main', '&:hover': { bgcolor: 'error.light', color: 'white' } }}
            >
              Delete
            </Button>
          </Box>
          <Box sx={{ bgcolor: 'rgba(0,0,0,0.7)', color: 'white', px: 1.5, py: 0.5, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ImageIcon sx={{ fontSize: 16 }} />
            <Typography variant="caption">{currentIndex + 1} / {allImages.length}</Typography>
          </Box>
        </Box>
      </Box>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <Box sx={{ display: 'flex', gap: 0.5, mt: 1.5, overflowX: 'auto', pb: 1 }}>
          {allImages.map((img, index) => (
            <Box
              key={img.id}
              onClick={() => setCurrentIndex(index)}
              sx={{
                width: { xs: 60, sm: 80 },
                height: { xs: 45, sm: 55 },
                flexShrink: 0,
                borderRadius: 1,
                overflow: 'hidden',
                cursor: 'pointer',
                border: '2px solid',
                borderColor: index === currentIndex ? 'primary.main' : img.type === 'new' ? 'success.main' : 'transparent',
                opacity: index === currentIndex ? 1 : 0.7,
                '&:hover': { opacity: 1 },
              }}
            >
              <img src={img.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </Box>
          ))}
        </Box>
      )}

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onClose={() => setLightboxOpen(false)} maxWidth="lg" fullWidth>
        <DialogContent sx={{ p: 0, bgcolor: 'black' }}>
          <IconButton onClick={() => setLightboxOpen(false)} sx={{ position: 'absolute', top: 8, right: 8, color: 'white', zIndex: 1 }}>
            <CloseIcon />
          </IconButton>
          <img src={allImages[currentIndex]?.src} alt="" style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

// Editable Info Card
interface EditCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  color?: string;
  rows?: number;
}

const EditInfoCard: React.FC<EditCardProps> = ({ icon, title, value, onChange, placeholder, color = '#1976d2', rows = 4 }) => (
  <Card elevation={0} sx={{ height: '100%', border: '1px solid', borderColor: 'divider', borderRadius: { xs: 2, md: 3 } }}>
    <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Box sx={{ p: 0.75, borderRadius: 1.5, bgcolor: `${color}15`, color: color }}>{icon}</Box>
        <Typography variant="subtitle1" fontWeight={600}>{title}</Typography>
      </Box>
      <TextField
        fullWidth
        multiline
        rows={rows}
        size="small"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'grey.50' } }}
      />
    </CardContent>
  </Card>
);

// Main Component
const ProjectFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;
  usePageTitle(isEdit ? 'Edit Project' : 'New Project');
  const { setBreadcrumbs } = useBreadcrumbs();
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  const [form, setForm] = useState<ProjectFormData | null>(null);
  const [brochureFile, setBrochureFile] = useState<File | null>(null);
  const [elevationFiles, setElevationFiles] = useState<File[]>([]);
  const [elevationPreviews, setElevationPreviews] = useState<string[]>([]);
  const [existingElevations, setExistingElevations] = useState<ProjectImage[]>([]);

  React.useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Projects', path: '/projects/list', icon: <BusinessIcon fontSize="small" /> },
      { label: isEdit ? 'Edit' : 'New' },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs, isEdit]);

  const { data: choices } = useQuery({
    queryKey: ['project-choices'],
    queryFn: () => projectsApi.choices(),
    staleTime: 10 * 60 * 1000,
  });

  const { data: project } = useQuery<Project>({
    queryKey: ['project', id],
    queryFn: () => projectsApi.get(id!),
    enabled: isEdit,
  });

  const { data: projectImages } = useQuery<ProjectImage[]>({
    queryKey: ['project-images', id],
    queryFn: () => projectsApi.getImages(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    // Try projectImages query first
    if (projectImages) {
      const imagesArray = Array.isArray(projectImages) 
        ? projectImages 
        : (projectImages as any)?.results || [];
      const elevationImgs = imagesArray.filter((img: ProjectImage) => img.image_type === 'ELEVATION');
      setExistingElevations(elevationImgs.length > 0 ? elevationImgs : imagesArray);
    } 
    // Fallback to project.images if available
    else if (project?.images && Array.isArray(project.images)) {
      const elevationImgs = project.images.filter((img: ProjectImage) => img.image_type === 'ELEVATION');
      setExistingElevations(elevationImgs.length > 0 ? elevationImgs : project.images);
    }
  }, [projectImages, project]);

  useEffect(() => {
    if (isEdit && project) {
      setForm({
        name: project.name,
        developer_name: project.developer_name || '',
        project_type: project.project_type || 'PLOT',
        location: project.location || null,
        approval_type: project.approval_type || 'PENDING',
        status: project.status || 'UPCOMING',
        overview: project.overview || '',
        description: project.description || '',
        amenities: project.amenities || '',
        specifications: project.specifications || '',
        floor_plans_text: project.floor_plans_text || '',
      });
    } else if (!isEdit) {
      setForm({ name: '', developer_name: '', project_type: 'PLOT', location: null, approval_type: 'PENDING', status: 'UPCOMING', overview: '', description: '', amenities: '', specifications: '', floor_plans_text: '' });
    }
  }, [project, isEdit]);

  const saveMutation = useMutation({
    mutationFn: async (payload: ProjectFormData) => {
      const saved = isEdit ? await projectsApi.update(id!, payload) : await projectsApi.create(payload);
      if (elevationFiles.length > 0) await projectsApi.uploadImages(saved.id, elevationFiles, 'ELEVATION');
      return saved;
    },
    onSuccess: (saved) => {
      success(isEdit ? 'Project updated' : 'Project created');
      // Invalidate all related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', saved.id] });
      queryClient.invalidateQueries({ queryKey: ['project-images', saved.id] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['project-images', id] });
      navigate(`/projects/view/${saved.id}`);
    },
    onError: (err: any) => toastError(err.response?.data?.message || 'Save failed'),
  });

  const deleteImageMutation = useMutation({
    mutationFn: (imageId: string) => projectsApi.deleteImage(imageId),
    onSuccess: () => {
      success('Image deleted');
      // Refetch images after deletion
      queryClient.invalidateQueries({ queryKey: ['project-images', id] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
    onError: () => toastError('Delete failed'),
  });

  const handleAddImages = (files: File[]) => {
    setElevationFiles(prev => [...prev, ...files]);
    setElevationPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const handleDeleteNewImage = (index: number) => {
    setElevationFiles(prev => prev.filter((_, i) => i !== index));
    setElevationPreviews(prev => prev.filter((_, i) => i !== index));
  };

  if (!form) return <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;

  const handleSubmit = () => {
    if (!form.name.trim()) { toastError('Project name is required'); return; }
    saveMutation.mutate({ ...form, brochure: brochureFile || undefined });
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Back Button */}
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/projects/list')} sx={{ mb: 2 }}>
        Back to Projects
      </Button>

      {/* Hero Section */}
      <Paper elevation={0} sx={{ borderRadius: { xs: 2, md: 4 }, overflow: 'hidden', mb: { xs: 2, md: 3 }, border: '1px solid', borderColor: 'divider' }}>
        <Grid container>
          {/* Image Carousel */}
          <Grid size={{ xs: 12, lg: 7 }}>
            <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
              <EditImageCarousel
                existingImages={existingElevations}
                newPreviews={elevationPreviews}
                onDeleteExisting={(imgId) => deleteImageMutation.mutate(imgId)}
                onDeleteNew={handleDeleteNewImage}
                onAddImages={handleAddImages}
              />
            </Box>
          </Grid>

          {/* Project Info */}
          <Grid size={{ xs: 12, lg: 5 }}>
            <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'grey.50' }}>
              {isEdit && project?.code && (
                <Chip label={project.code} size="small" sx={{ alignSelf: 'flex-start', mb: 1.5, fontWeight: 600 }} color="primary" variant="outlined" />
              )}

              <TextField
                fullWidth
                required
                size="small"
                label="Project Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { bgcolor: 'white' } }}
              />

              <TextField
                fullWidth
                size="small"
                label="Developer Name"
                value={form.developer_name}
                onChange={(e) => setForm({ ...form, developer_name: e.target.value })}
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { bgcolor: 'white' } }}
              />

              <TextField
                fullWidth
                size="small"
                label="Location"
                value={form.location || ''}
                onChange={(e) => setForm({ ...form, location: e.target.value || null })}
                InputProps={{ startAdornment: <LocationOnIcon color="primary" sx={{ mr: 1 }} /> }}
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { bgcolor: 'white' } }}
              />

              <Grid container spacing={1.5} sx={{ mb: 2 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Type</InputLabel>
                    <Select label="Type" value={form.project_type || 'PLOT'} onChange={(e) => setForm({ ...form, project_type: e.target.value })} sx={{ bgcolor: 'white' }}>
                      {(choices?.project_types || []).map((c) => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Approval</InputLabel>
                    <Select label="Approval" value={form.approval_type || 'PENDING'} onChange={(e) => setForm({ ...form, approval_type: e.target.value })} sx={{ bgcolor: 'white' }}>
                      {(choices?.approval_types || []).map((c) => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select label="Status" value={form.status || 'UPCOMING'} onChange={(e) => setForm({ ...form, status: e.target.value })} sx={{ bgcolor: 'white' }}>
                      {(choices?.project_statuses || []).map((c) => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <TextField
                fullWidth
                size="small"
                label="Project Overview"
                multiline
                rows={3}
                placeholder="Brief overview..."
                value={form.overview || ''}
                onChange={(e) => setForm({ ...form, overview: e.target.value })}
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { bgcolor: 'white' } }}
              />

              <Divider sx={{ my: 1 }} />

              {/* Brochure */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Brochure (PDF)</Typography>
                <Box
                  component="label"
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5,
                    border: '1px dashed', borderColor: 'divider', borderRadius: 2,
                    cursor: 'pointer', bgcolor: 'white', '&:hover': { borderColor: 'primary.main' },
                  }}
                >
                  <PictureAsPdfIcon sx={{ color: brochureFile || project?.brochure ? 'error.main' : 'grey.400' }} />
                  <Box sx={{ flex: 1 }}>
                    {brochureFile ? (
                      <Typography variant="body2" noWrap>{brochureFile.name}</Typography>
                    ) : project?.brochure ? (
                      <Typography variant="body2" color="text.secondary">Brochure uploaded</Typography>
                    ) : (
                      <Typography variant="body2" color="text.disabled">Click to upload PDF</Typography>
                    )}
                  </Box>
                  {(brochureFile || project?.brochure) && (
                    <IconButton size="small" onClick={(e) => { e.preventDefault(); setBrochureFile(null); }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                  <input type="file" hidden accept=".pdf" onChange={(e) => setBrochureFile(e.target.files?.[0] || null)} />
                </Box>
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 'auto' }}>
                <Button variant="outlined" onClick={() => navigate(-1)}>Cancel</Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSubmit}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? 'Saving...' : (isEdit ? 'Update' : 'Create')}
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Details Grid - Same as View */}
      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <EditInfoCard
            icon={<DescriptionIcon />}
            title="Description"
            color="#1976d2"
            value={form.description || ''}
            onChange={(val) => setForm({ ...form, description: val })}
            placeholder="Full project description..."
            rows={5}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <EditInfoCard
            icon={<SettingsIcon />}
            title="Specifications"
            color="#9c27b0"
            value={form.specifications || ''}
            onChange={(val) => setForm({ ...form, specifications: val })}
            placeholder="Total Area: 50 Acres&#10;Total Units: 500..."
            rows={5}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <EditInfoCard
            icon={<PoolIcon />}
            title="Amenities"
            color="#00897b"
            value={form.amenities || ''}
            onChange={(val) => setForm({ ...form, amenities: val })}
            placeholder="Swimming Pool&#10;Gym&#10;Club House..."
            rows={5}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <EditInfoCard
            icon={<GridViewIcon />}
            title="Floor Plans"
            color="#ff5722"
            value={form.floor_plans_text || ''}
            onChange={(val) => setForm({ ...form, floor_plans_text: val })}
            placeholder="Ground Floor: 1200 sq.ft&#10;First Floor: 1100 sq.ft..."
            rows={5}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProjectFormPage;
