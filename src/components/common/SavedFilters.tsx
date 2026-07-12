/**
 * SavedFilters Component
 * 
 * Allows users to save, load, and manage filter configurations
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  IconButton,
  Chip,
  Typography,
  FormControlLabel,
  Switch,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Save as SaveIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import apiClient from '../../api/axios.config';
import { useToast } from '../../contexts/ToastContext';
import type { SavedFilter, FilterRule } from '../../types/filter.types';

interface SavedFiltersProps {
  screenName: string;
  currentRules: FilterRule[];
  onApplyFilter: (filter: SavedFilter) => void;
  onSaveSuccess?: (filter: SavedFilter) => void;
}

export const SavedFilters: React.FC<SavedFiltersProps> = ({
  screenName,
  currentRules,
  onApplyFilter,
  onSaveSuccess,
}) => {
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [filterDescription, setFilterDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    fetchSavedFilters();
  }, [screenName]);

  const fetchSavedFilters = async () => {
    setFetchLoading(true);
    try {
      const response = await apiClient.get('/system/saved-filters/', {
        params: { screen_name: screenName },
      });
      const data = response.data.results || response.data;
      setSavedFilters(Array.isArray(data) ? data : []);
    } catch (error) {
      toastError('Failed to load saved filters');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSaveFilter = async () => {
    if (!filterName.trim()) {
      toastError('Filter name is required');
      return;
    }

    if (currentRules.length === 0) {
      toastError('No filters to save');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/system/saved-filters/', {
        name: filterName,
        description: filterDescription,
        filter_config: { rules: currentRules, logic: 'AND' },
        screen_name: screenName,
        is_public: isPublic,
        is_default: isDefault,
      });

      const newFilter = response.data;
      setSavedFilters([newFilter, ...savedFilters]);
      setSaveDialogOpen(false);
      setFilterName('');
      setFilterDescription('');
      setIsPublic(false);
      setIsDefault(false);
      toastSuccess('Filter saved successfully');

      if (onSaveSuccess) {
        onSaveSuccess(newFilter);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to save filter';
      toastError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFilter = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this filter?')) {
      return;
    }

    try {
      await apiClient.delete(`/system/saved-filters/${id}/`);
      setSavedFilters(savedFilters.filter((f) => f.id !== id));
      toastSuccess('Filter deleted successfully');
    } catch (error) {
      toastError('Failed to delete filter');
    }
  };

  const handleApplyFilter = async (filter: SavedFilter) => {
    try {
      // Track usage
      await apiClient.post(`/system/saved-filters/${filter.id}/apply/`);
      
      // Update local usage count
      setSavedFilters(
        savedFilters.map((f) =>
          f.id === filter.id ? { ...f, usage_count: f.usage_count + 1 } : f
        )
      );

      onApplyFilter(filter);
      toastSuccess(`Applied filter: ${filter.name}`);
    } catch (error) {
      toastError('Failed to apply filter');
    }
  };

  const handleSetDefault = async (filter: SavedFilter) => {
    try {
      // First, unset other defaults
      const updates = savedFilters.map((f) => {
        if (f.is_default && f.id !== filter.id) {
          return apiClient.patch(`/system/saved-filters/${f.id}/`, {
            is_default: false,
          });
        }
        return null;
      });

      await Promise.all(updates.filter(Boolean));

      // Set the new default
      await apiClient.patch(`/system/saved-filters/${filter.id}/`, {
        is_default: !filter.is_default,
      });

      // Update local state
      setSavedFilters(
        savedFilters.map((f) => ({
          ...f,
          is_default: f.id === filter.id ? !filter.is_default : false,
        }))
      );

      toastSuccess(
        filter.is_default ? 'Removed default filter' : 'Set as default filter'
      );
    } catch (error) {
      toastError('Failed to update default filter');
    }
  };

  return (
    <>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Saved Filters</Typography>
          <Button
            variant="outlined"
            startIcon={<SaveIcon />}
            onClick={() => setSaveDialogOpen(true)}
            disabled={currentRules.length === 0}
            size="small"
          >
            Save Current
          </Button>
        </Box>

        {/* Filters List */}
        {fetchLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : savedFilters.length === 0 ? (
          <Alert severity="info">
            No saved filters yet. Create filters and save them for quick access.
          </Alert>
        ) : (
          <List>
            {savedFilters.map((filter) => (
              <ListItem
                key={filter.id}
                secondaryAction={
                  <Box>
                    <IconButton
                      edge="end"
                      onClick={() => handleSetDefault(filter)}
                      color={filter.is_default ? 'primary' : 'default'}
                      title={filter.is_default ? 'Remove default' : 'Set as default'}
                    >
                      {filter.is_default ? <StarIcon /> : <StarBorderIcon />}
                    </IconButton>
                    <IconButton edge="end" onClick={() => handleDeleteFilter(filter.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                }
                disablePadding
              >
                <ListItemButton onClick={() => handleApplyFilter(filter)}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        {filter.name}
                        {filter.is_default && (
                          <Chip label="Default" size="small" color="primary" />
                        )}
                        {filter.is_public ? (
                          <Chip
                            icon={<PublicIcon />}
                            label="Public"
                            size="small"
                            variant="outlined"
                          />
                        ) : (
                          <Chip
                            icon={<LockIcon />}
                            label="Private"
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        {filter.description && <Typography variant="body2">{filter.description}</Typography>}
                        <Typography variant="caption" color="text.secondary">
                          Used {filter.usage_count} times
                          {filter.filter_config?.rules && 
                            ` • ${filter.filter_config.rules.length} rule${filter.filter_config.rules.length !== 1 ? 's' : ''}`
                          }
                        </Typography>
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      {/* Save Filter Dialog */}
      <Dialog
        open={saveDialogOpen}
        onClose={(_event, reason) => {
          if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
            return;
          }
          if (!loading) setSaveDialogOpen(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Save Filter
          <IconButton
            aria-label="close"
            onClick={() => !loading && setSaveDialogOpen(false)}
            size="small"
            disabled={loading}
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              autoFocus
              label="Filter Name"
              type="text"
              fullWidth
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              required
              placeholder="e.g., High Value Orders"
            />
            <TextField
              label="Description (optional)"
              type="text"
              fullWidth
              multiline
              rows={3}
              value={filterDescription}
              onChange={(e) => setFilterDescription(e.target.value)}
              placeholder="Brief description of what this filter does"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />
              }
              label="Make this filter public (visible to all users)"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                />
              }
              label="Set as default filter for this screen"
            />
            {currentRules.length > 0 && (
              <Alert severity="info">
                Saving {currentRules.length} filter rule{currentRules.length !== 1 ? 's' : ''}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveFilter}
            variant="contained"
            disabled={loading || !filterName.trim()}
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {loading ? 'Saving...' : 'Save Filter'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SavedFilters;
