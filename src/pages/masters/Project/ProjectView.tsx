import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Paper, Grid, Typography, Button, Divider,
  CircularProgress, Alert, Dialog, DialogContent, DialogActions, DialogTitle,
  Chip, IconButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GridViewIcon from '@mui/icons-material/GridView';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { projectsApi } from '../../../api/projects';
import { usePageTitle } from '../../../hooks';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { useToast } from '../../../contexts/ToastContext';
import type { Project, ProjectImage } from '../../../types/project.types';
import HomeIcon from '@mui/icons-material/Home';
import BusinessIcon from '@mui/icons-material/Business';

// Image Carousel Component
interface ImageCarouselProps {
  images: ProjectImage[];
  onImageClick: (index: number) => void;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images, onImageClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  if (images.length === 0) {
    return (
      <Box
        sx={{
          height: { xs: 250, sm: 350, md: 450 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'grey.100',
          borderRadius: { xs: 2, md: 3 },
        }}
      >
        <Box sx={{ textAlign: 'center', px: 2 }}>
          <ImageIcon sx={{ fontSize: { xs: 48, md: 80 }, color: 'grey.400', mb: 1 }} />
          <Typography variant="body1" color="text.secondary">
            No elevation images uploaded
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Main Image Display */}
      <Box
        sx={{
          position: 'relative',
          height: { xs: 250, sm: 350, md: 450 },
          borderRadius: { xs: 2, md: 3 },
          overflow: 'hidden',
          bgcolor: 'grey.900',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={currentIndex}
            src={images[currentIndex].image}
            alt={images[currentIndex].title || `Image ${currentIndex + 1}`}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            onClick={() => onImageClick(currentIndex)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              cursor: 'pointer',
            }}
          />
        </AnimatePresence>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <IconButton
              onClick={goToPrevious}
              size="small"
              sx={{
                position: 'absolute',
                left: { xs: 8, md: 16 },
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(255,255,255,0.9)',
                '&:hover': { bgcolor: 'white' },
                boxShadow: 2,
              }}
            >
              <ChevronLeftIcon />
            </IconButton>
            <IconButton
              onClick={goToNext}
              size="small"
              sx={{
                position: 'absolute',
                right: { xs: 8, md: 16 },
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(255,255,255,0.9)',
                '&:hover': { bgcolor: 'white' },
                boxShadow: 2,
              }}
            >
              <ChevronRightIcon />
            </IconButton>
          </>
        )}

        {/* Image Counter Badge */}
        <Box
          sx={{
            position: 'absolute',
            bottom: { xs: 8, md: 16 },
            right: { xs: 8, md: 16 },
            bgcolor: 'rgba(0,0,0,0.7)',
            color: 'white',
            px: { xs: 1, md: 2 },
            py: 0.5,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          <ImageIcon sx={{ fontSize: { xs: 14, md: 18 } }} />
          <Typography variant="caption">
            {currentIndex + 1} / {images.length}
          </Typography>
        </Box>

        {/* Click hint - hide on mobile */}
        <Box
        />
      </Box>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <Box
          sx={{
            display: 'flex',
            gap: { xs: 0.5, md: 1 },
            mt: { xs: 1, md: 2 },
            overflowX: 'auto',
            pb: 1,
            '&::-webkit-scrollbar': { height: 4 },
            '&::-webkit-scrollbar-thumb': { bgcolor: 'grey.400', borderRadius: 3 },
          }}
        >
          {images.map((img, index) => (
            <Box
              key={img.id}
              onClick={() => setCurrentIndex(index)}
              sx={{
                width: { xs: 60, sm: 80, md: 100 },
                height: { xs: 45, sm: 55, md: 70 },
                flexShrink: 0,
                borderRadius: 1,
                overflow: 'hidden',
                cursor: 'pointer',
                border: index === currentIndex ? '2px solid' : '2px solid transparent',
                borderColor: index === currentIndex ? 'primary.main' : 'transparent',
                opacity: index === currentIndex ? 1 : 0.6,
                transition: 'all 0.2s ease',
                '&:hover': { opacity: 1 },
              }}
            >
              <img
                src={img.image}
                alt={img.title || `Thumbnail ${index + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

// Fullscreen Lightbox Component
interface LightboxProps {
  images: ProjectImage[];
  initialIndex: number;
  open: boolean;
  onClose: () => void;
  onDelete?: (imageId: string) => void;
}

const ImageLightbox: React.FC<LightboxProps> = ({ images, initialIndex, open, onClose, onDelete }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  React.useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  if (!open || images.length === 0) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth={false} fullScreen>
      <Box
        sx={{
          bgcolor: 'rgba(0,0,0,0.95)',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Typography variant="h6" color="white">
            {currentIndex + 1} of {images.length}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {onDelete && (
              <IconButton onClick={() => onDelete(images[currentIndex].id)} sx={{ color: 'error.light' }}>
                <DeleteIcon />
              </IconButton>
            )}
            <IconButton onClick={onClose} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Main Image */}
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {images.length > 1 && (
            <IconButton
              onClick={goToPrevious}
              sx={{ position: 'absolute', left: 20, color: 'white', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
            >
              <ChevronLeftIcon fontSize="large" />
            </IconButton>
          )}
          
          <AnimatePresence mode="wait">
            <motion.img
              key={currentIndex}
              src={images[currentIndex].image}
              alt={images[currentIndex].title || `Image ${currentIndex + 1}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              style={{ maxWidth: '90%', maxHeight: '80vh', objectFit: 'contain', borderRadius: 8 }}
            />
          </AnimatePresence>
          
          {images.length > 1 && (
            <IconButton
              onClick={goToNext}
              sx={{ position: 'absolute', right: 20, color: 'white', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
            >
              <ChevronRightIcon fontSize="large" />
            </IconButton>
          )}
        </Box>

        {/* Thumbnail Strip */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, p: 2, overflowX: 'auto' }}>
          {images.map((img, index) => (
            <Box
              key={img.id}
              onClick={() => setCurrentIndex(index)}
              sx={{
                width: 80,
                height: 60,
                borderRadius: 1,
                overflow: 'hidden',
                cursor: 'pointer',
                border: index === currentIndex ? '2px solid white' : '2px solid transparent',
                opacity: index === currentIndex ? 1 : 0.5,
                transition: 'all 0.2s',
                '&:hover': { opacity: 1 },
              }}
            >
              <img src={img.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </Box>
          ))}
        </Box>
      </Box>
    </Dialog>
  );
};

// Main Component
const ProjectView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();
  const queryClient = useQueryClient();
  usePageTitle('Project Details');

  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  React.useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
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
    staleTime: 0, // Always refetch
  });

  // Project images query
  const { data: projectImages, refetch: refetchImages } = useQuery({
    queryKey: ['project-images', id],
    queryFn: () => projectsApi.getImages(id!),
    enabled: !!id,
    staleTime: 0, // Always refetch
  });

  const imagesArray: ProjectImage[] = Array.isArray(projectImages) 
    ? projectImages 
    : (project?.images && Array.isArray(project.images) ? project.images : []);
  // Show ELEVATION images, or all images if no ELEVATION type exists
  const elevationImages = imagesArray.filter((img: ProjectImage) => img.image_type === 'ELEVATION');
  // Fallback: if no elevation images, use all images (in case image_type is not set)
  const displayImages = elevationImages.length > 0 ? elevationImages : imagesArray;

  // Upload images mutation
  const uploadImagesMutation = useMutation({
    mutationFn: ({ files }: { files: File[] }) => projectsApi.uploadImages(id!, files, 'ELEVATION'),
    onSuccess: () => {
      toastSuccess('Images uploaded successfully');
      setImageDialogOpen(false);
      setSelectedFiles([]);
      refetchImages();
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
    onError: () => { toastError('Failed to upload images'); },
  });

  // Delete image mutation
  const deleteImageMutation = useMutation({
    mutationFn: (imageId: string) => projectsApi.deleteImage(imageId),
    onSuccess: () => {
      toastSuccess('Image deleted');
      refetchImages();
      if (displayImages.length <= 1) setLightboxOpen(false);
    },
    onError: () => { toastError('Failed to delete image'); },
  });

  // Share function - direct WhatsApp URL
  const handleWhatsAppShare = () => {
    if (!project) return;
    
    const text = `*${project.name}*\n\n` +
      `${project.overview || ''}\n\n` +
      `Location: ${project.location || 'N/A'}\n\n` +
      `*Description:*\n${project.description || 'N/A'}\n\n` +
      `*Amenities:*\n${project.amenities || 'N/A'}\n\n` +
      `*Specifications:*\n${project.specifications || 'N/A'}\n\n` +
      `*Floor Plans:*\n${project.floor_plans_text || 'N/A'}\n\n` +
      `${window.location.href}`;

    // Use WhatsApp API - opens WhatsApp directly on mobile, web on desktop
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleOpenLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (isError || !project) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {(error as any)?.response?.data?.detail || 'Project not found'}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>Back</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, width: '100%' }}>
      {/* Back Button */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/projects/list')}
        sx={{ mb: 2 }}
      >
        Back to Projects
      </Button>

      {/* Hero Section - Image Carousel + Project Header */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: { xs: 2, md: 4 },
          overflow: 'hidden',
          mb: { xs: 2, md: 3 },
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Grid container>
          {/* Image Carousel - Left Side */}
          <Grid size={{ xs: 12, lg: 7 }}>
            <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
              <ImageCarousel
                images={displayImages}
                onImageClick={handleOpenLightbox}
              />
            </Box>
          </Grid>

          {/* Project Info - Right Side */}
          <Grid size={{ xs: 12, lg: 5 }}>
            <Box
              sx={{
                p: { xs: 2, sm: 3, md: 4 },
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'grey.50',
              }}
            >
              {/* Project Code Badge */}
              <Chip
                label={project.code}
                size="small"
                sx={{ alignSelf: 'flex-start', mb: 1.5, fontWeight: 600 }}
                color="primary"
                variant="outlined"
              />

              {/* Project Name */}
              <Typography 
                variant="h5" 
                fontWeight={700} 
                sx={{ 
                  mb: 1,
                  fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
                }}
              >
                {project.name}
              </Typography>

              {/* Developer */}
              {project.developer_name && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  by {project.developer_name}
                </Typography>
              )}

              {/* Location */}
              {project.location && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <LocationOnIcon color="primary" fontSize="small" />
                  <Typography variant="body2">{project.location}</Typography>
                </Box>
              )}

              {/* Overview - hide on mobile to save space */}
              {project.overview && (
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    mb: 2, 
                    lineHeight: 1.6,
                    display: { xs: 'none', sm: 'block' },
                  }}
                >
                  {project.overview}
                </Typography>
              )}

              <Divider sx={{ my: { xs: 1.5, md: 2 } }} />

              {/* Action Buttons - All in one row */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 'auto' }}>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/projects/edit/${project.id}`)}
                  sx={{ borderRadius: 2 }}
                >
                  Edit
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => setImageDialogOpen(true)}
                  sx={{ borderRadius: 2 }}
                >
                  Add Images
                </Button>
                {project.brochure && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<PictureAsPdfIcon />}
                    href={project.brochure}
                    target="_blank"
                    color="error"
                    sx={{ borderRadius: 2 }}
                  >
                    Brochure
                  </Button>
                )}
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  startIcon={<WhatsAppIcon />}
                  onClick={handleWhatsAppShare}
                  sx={{ borderRadius: 2 }}
                >
                  WhatsApp
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Floor Plans */}
      <Paper elevation={0} sx={{ borderRadius: { xs: 2, md: 4 }, p: { xs: 2, md: 3 }, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Box sx={{ p: 0.75, borderRadius: 1.5, bgcolor: '#ff572215', color: '#ff5722', display: 'flex' }}>
            <GridViewIcon fontSize="small" />
          </Box>
          <Typography variant="subtitle1" fontWeight={600}>Floor Plans</Typography>
        </Box>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, color: 'text.secondary' }}>
          {project.floor_plans_text || 'No floor plan details available.'}
        </Typography>
      </Paper>

      {/* Image Upload Dialog */}
      <Dialog open={imageDialogOpen} onClose={() => setImageDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1, fontSize: { xs: '1rem', md: '1.25rem' } }}>Upload Elevation Images</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              border: '2px dashed',
              borderColor: selectedFiles.length > 0 ? 'primary.main' : 'divider',
              borderRadius: 3,
              p: 4,
              textAlign: 'center',
              mt: 1,
              bgcolor: selectedFiles.length > 0 ? 'primary.50' : 'background.default',
              transition: 'all 0.3s ease',
            }}
          >
            {selectedFiles.length > 0 ? (
              <Box>
                <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
                  {selectedFiles.length} file(s) selected
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                  {selectedFiles.map((f, i) => (
                    <Chip key={i} label={f.name} size="small" onDelete={() => setSelectedFiles(selectedFiles.filter((_, idx) => idx !== i))} />
                  ))}
                </Box>
              </Box>
            ) : (
              <>
                <CloudUploadIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">Drag & drop or select images</Typography>
                <Typography variant="body2" color="text.disabled">Supports: JPG, PNG, WebP</Typography>
              </>
            )}
            <Button component="label" variant="outlined" sx={{ mt: 3, borderRadius: 2 }}>
              Select Files
              <input type="file" hidden multiple accept="image/*" onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))} />
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => { setImageDialogOpen(false); setSelectedFiles([]); }}>Cancel</Button>
          <Button variant="contained" onClick={() => uploadImagesMutation.mutate({ files: selectedFiles })} disabled={selectedFiles.length === 0 || uploadImagesMutation.isPending} sx={{ borderRadius: 2 }}>
            {uploadImagesMutation.isPending ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Fullscreen Lightbox */}
      <ImageLightbox
        images={displayImages}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onDelete={(imageId) => deleteImageMutation.mutate(imageId)}
      />
    </Box>
  );
};

export default ProjectView;
