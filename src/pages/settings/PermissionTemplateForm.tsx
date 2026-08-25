import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  CircularProgress,
  FormControlLabel,
  Switch,
  Divider,
} from '@mui/material';
import {
  Save as SaveIcon,
  Home as HomeIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  permissionTemplateApi,
  type PermissionTemplateFormData,
  type MenuItem as MenuItemType,
  type MenuPermissionInput,
} from '../../api/users.api';
import { menuApi } from '../../api/menu.api';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks';
import ScreenHeader from '../../components/common/ScreenHeader';
import ScreenPermissionPicker from '../../components/settings/ScreenPermissionPicker';
import { getPageContainerStyles, getHeaderSectionStyles, getContentSectionStyles } from '../../utils/spacing';

interface FormData {
  name: string;
  description: string;
  is_active: boolean;
}

const PermissionTemplateForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();

  const isEditMode = id && id !== 'new';
  usePageTitle(isEditMode ? 'Edit Permission Template' : 'Create Permission Template');

  // Permission state: keyed by menuitem_id
  const [permissionsMap, setPermissionsMap] = useState<Record<string, MenuPermissionInput>>({});

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      name: '',
      description: '',
      is_active: true,
    },
  });

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Settings', path: '/settings', icon: <SettingsIcon fontSize="small" /> },
      { label: 'Permission Templates', path: '/settings/permission-templates', icon: <SecurityIcon fontSize="small" /> },
      { label: isEditMode ? 'Edit Template' : 'Add Template' },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs, isEditMode]);

  // Fetch all menu items for permission picker
  const { data: menuData } = useQuery({
    queryKey: ['allMenuItems'],
    queryFn: async () => {
      const allItems = await menuApi.getAllMenuItems();
      return allItems.map((item) => ({
        id: item.id,
        code: item.code,
        name: item.name,
        sequence: item.sequence,
      }));
    },
    staleTime: 10 * 60 * 1000,
  });

  // Convert menu items for ScreenPermissionPicker
  const availableMenuItems: MenuItemType[] = useMemo(() => {
    if (!menuData || !Array.isArray(menuData)) return [];
    const uniqueById = new Map<string, MenuItemType>();
    menuData.forEach((item, idx) => {
      const key = String(item.id);
      if (!uniqueById.has(key)) {
        uniqueById.set(key, {
          id: item.id,
          code: item.code,
          name: item.name,
          sequence: item.sequence ?? idx,
        });
      }
    });
    return Array.from(uniqueById.values()).sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
  }, [menuData]);

  // Fetch template data in edit mode
  const { data: templateData, isLoading: templateLoading } = useQuery({
    queryKey: ['permissionTemplate', id],
    queryFn: () => permissionTemplateApi.get(id!),
    enabled: !!isEditMode,
  });

  // Populate form when data loads
  useEffect(() => {
    if (!templateData) return;

    reset({
      name: templateData.name || '',
      description: templateData.description || '',
      is_active: templateData.is_active,
    });

    // Populate permission map from existing data
    if (templateData.details?.length) {
      const map: Record<string, MenuPermissionInput> = {};
      templateData.details.forEach((d) => {
        if (d.menuitem_id) {
          map[String(d.menuitem_id)] = {
            menuitem_id: d.menuitem_id,
            can_view: d.can_view,
            can_add: d.can_add,
            can_edit: d.can_edit,
            can_delete: d.can_delete,
            can_export: d.can_export,
          };
        }
      });
      setPermissionsMap(map);
    }
  }, [templateData, reset]);

  const createMutation = useMutation({
    mutationFn: (data: PermissionTemplateFormData) => permissionTemplateApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissionTemplates'] });
      toastSuccess('Permission template created successfully');
      setTimeout(() => navigate('/settings/permission-templates'), 500);
    },
    onError: (error: any) => {
      toastError(error?.response?.data?.detail || error?.response?.data?.name?.[0] || 'Failed to create template');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: PermissionTemplateFormData) => permissionTemplateApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissionTemplates'] });
      queryClient.invalidateQueries({ queryKey: ['permissionTemplate', id] });
      toastSuccess('Permission template updated successfully');
      setTimeout(() => navigate('/settings/permission-templates'), 500);
    },
    onError: (error: any) => {
      toastError(error?.response?.data?.detail || 'Failed to update template');
    },
  });

  const onSubmit = (data: FormData) => {
    // Build details_input from permissionsMap
    const details_input = Object.values(permissionsMap)
      .filter((p) => p.can_view || p.can_add || p.can_edit || p.can_delete || p.can_export)
      .map((p) => ({
        menuitem_id: String(p.menuitem_id),
        can_view: p.can_view,
        can_add: p.can_add,
        can_edit: p.can_edit,
        can_delete: p.can_delete,
        can_export: p.can_export,
      }));

    const submitData: PermissionTemplateFormData = {
      name: data.name,
      description: data.description,
      is_active: data.is_active,
      details_input,
    };

    if (isEditMode) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (templateLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={getPageContainerStyles()}>
      {/* Header */}
      <Box sx={getHeaderSectionStyles()}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <ScreenHeader
            title={isEditMode ? 'Edit Permission Template' : 'Add Permission Template'}
            showBackButton
            onBack={() => navigate('/settings/permission-templates')}
            disableBox
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              onClick={() => navigate('/settings/permission-templates')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="template-form"
              variant="contained"
              size="small"
              startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <SaveIcon fontSize="small" />}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update Template' : 'Create Template'}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={getContentSectionStyles()}>
        <Paper sx={{ p: 3, borderRadius: 0 }}>
          <form id="template-form" onSubmit={handleSubmit(onSubmit)}>
            {/* Basic Info */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              Template Information
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600 }}>
                  Template Name <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                </Typography>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: 'Template name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., Sales Team, Manager, Admin"
                      fullWidth
                      size="small"
                      error={!!errors.name}
                      helperText={errors.name?.message}
                      disabled={isSubmitting}
                    />
                  )}
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600 }}>
                  Description
                </Typography>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="Brief description of this permission template"
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      disabled={isSubmitting}
                    />
                  )}
                />
              </Box>

              <Box>
                <Controller
                  name="is_active"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} disabled={isSubmitting} />}
                      label={
                        <Box>
                          <Typography variant="body2" fontWeight={600}>Active</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Inactive templates won't appear in dropdown selections
                          </Typography>
                        </Box>
                      }
                    />
                  )}
                />
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Screen Permissions */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              Screen Permissions
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Define which screens and actions are included in this template.
            </Typography>

            <ScreenPermissionPicker
              availableScreens={availableMenuItems}
              value={permissionsMap}
              onChange={setPermissionsMap}
              disabled={isSubmitting}
            />
          </form>
        </Paper>
      </Box>
    </Box>
  );
};

export default PermissionTemplateForm;
