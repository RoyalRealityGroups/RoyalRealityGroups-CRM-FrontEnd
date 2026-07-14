// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Paper,
  TextField,
  CircularProgress,
  Typography,
  Autocomplete,
  Alert,
  List,
  ListItemButton,
  ListItemText,
  Collapse,
  Checkbox,
  FormControlLabel,
  Divider,
  Stack,
  Switch,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Home as HomeIcon,
  Settings as SettingsIcon,
  Groups as GroupsIcon,
  ExpandLess,
  ExpandMore,
  FiberManualRecord as DotIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupsApi } from '../../api/groups.api';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks';
import type { GroupFormData, Group, Permission } from '../../types/auth.types';
import ScreenHeader from '../../components/common/ScreenHeader';
import {
  getPageContainerStyles,
  getHeaderSectionStyles,
  getContentSectionStyles,
} from '../../utils/spacing';

interface ContentTypeDetail {
  id: number;
  name: string;
  app_label: string;
  model: string;
  contenttype?: { id: number };
  permissions: Permission[];
}

interface AppItem {
  id: number;
  name: string;
  app_label: string;
  sequence: number;
  contenttypedetails: ContentTypeDetail[];
}

const GroupForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();

  usePageTitle(id === 'new' ? 'Create Group' : 'Edit Group');
  const isEditMode = id !== 'new';

  const [selectedReportingTo, setSelectedReportingTo] = useState<Group | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<number>>(new Set());
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [expandedApps, setExpandedApps] = useState<Set<number>>(new Set());
  const [expandedContentTypes, setExpandedContentTypes] = useState<Set<number>>(new Set());

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GroupFormData>({
    defaultValues: {
      name: '',
      permission_ids: [],
      reporting_to_id: undefined,
    },
  });

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Settings', path: '/settings', icon: <SettingsIcon fontSize="small" /> },
      { label: 'Groups', path: '/settings/groups', icon: <GroupsIcon fontSize="small" /> },
      { label: isEditMode ? 'Edit Group' : 'Add Group' },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs, isEditMode]);

  // Fetch group data if editing
  const { data: groupData, isLoading: groupLoading } = useQuery({
    queryKey: ['group', id],
    queryFn: () => groupsApi.get(Number(id)),
    enabled: isEditMode,
  });

  // Fetch apps with permissions
  const { data: appsData = [], isLoading: appsLoading } = useQuery<AppItem[]>({
    queryKey: ['apps-permissions'],
    queryFn: () => groupsApi.getAppPermissions(),
  });

  // Fetch all groups for reporting_to dropdown
  const { data: allGroups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ['groups-mini'],
    queryFn: async () => {
      const response = await groupsApi.list({ page_size: 1000 });
      return response.results;
    },
  });

  // Filter apps that have content types with permissions
  const filteredApps = useMemo(() => {
    // ponytail: hide internal/system apps from the Add Group permission picker
    const HIDDEN_APP_LABELS = new Set([
      'admin', 'auth', 'contenttypes', 'core_users', 'dispatch',
      'dynamic_preferences', 'general', 'invoice', 'receipt', 'receipts',
      'sales', 'sessions', 'sitevisit', 'system', 'thirdparty',
      'token_blacklist', 'delivery', 'dispatch',
    ]);
    return appsData
      .filter((app) => !HIDDEN_APP_LABELS.has((app.app_label || app.name || '').toLowerCase()))
      .filter((app) => app.contenttypedetails?.some((ct) => ct.permissions?.length > 0))
      .sort((a, b) => a.sequence - b.sequence || a.name.localeCompare(b.name));
  }, [appsData]);

  const selectedApp = useMemo(() => {
    return filteredApps.find((app) => app.id === selectedAppId) || null;
  }, [filteredApps, selectedAppId]);

  // Populate form when group data is loaded
  useEffect(() => {
    if (groupData) {
      const toPermissionId = (perm: any): number | null => {
        const rawId =
          typeof perm === 'number' || typeof perm === 'string'
            ? perm
            : perm?.id;
        const parsed = Number(rawId);
        return Number.isFinite(parsed) ? parsed : null;
      };
      const initialPermissionIds = (groupData.permissions || [])
        .map((perm) => toPermissionId(perm))
        .filter((value): value is number => value !== null);

      reset({
        name: groupData.name,
        permission_ids: initialPermissionIds,
        reporting_to_id: groupData.groupdetails?.reporting_to,
      });

      setSelectedPermissions(new Set(initialPermissionIds));

      if (groupData.groupdetails?.reporting_to) {
        const reportingGroup = allGroups.find((g) => g.id === groupData.groupdetails?.reporting_to);
        setSelectedReportingTo(reportingGroup || null);
      }
    }
  }, [groupData, allGroups, reset]);

  const createMutation = useMutation({
    mutationFn: (data: GroupFormData) => groupsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toastSuccess('Group created successfully');
      setTimeout(() => navigate('/settings/groups'), 1000);
    },
    onError: (error: any) => {
      toastError(error.response?.data?.message || 'Failed to create group');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: GroupFormData) => groupsApi.update(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      toastSuccess('Group updated successfully');
      setTimeout(() => navigate('/settings/groups'), 1000);
    },
    onError: (error: any) => {
      toastError(error.response?.data?.message || 'Failed to update group');
    },
  });

  const onSubmit = (data: GroupFormData) => {
    const submitData = {
      ...data,
      permission_ids: Array.from(selectedPermissions).filter((id) => Number.isFinite(id)),
      reporting_to_id: selectedReportingTo?.id,
    };

    if (isEditMode) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleCancel = () => {
    navigate('/settings/groups');
  };

  const handlePermissionToggle = (permissionId: number) => {
    setSelectedPermissions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(permissionId)) {
        newSet.delete(permissionId);
      } else {
        newSet.add(permissionId);
      }
      return newSet;
    });
  };

  const handleToggleContentType = (ctId: number) => {
    setExpandedContentTypes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(ctId)) {
        newSet.delete(ctId);
      } else {
        newSet.add(ctId);
      }
      return newSet;
    });
  };

  const handleSelectAllContentType = (permissions: Permission[]) => {
    const allChecked = permissions.every((p) => selectedPermissions.has(p.id));
    setSelectedPermissions((prev) => {
      const newSet = new Set(prev);
      permissions.forEach((p) => {
        if (allChecked) {
          newSet.delete(p.id);
        } else {
          newSet.add(p.id);
        }
      });
      return newSet;
    });
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isLoading = groupLoading || appsLoading || groupsLoading;

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={getPageContainerStyles()}>
      {/* Fixed Header with Title and Actions */}
      <Box sx={getHeaderSectionStyles()}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}>
          <ScreenHeader
            title={isEditMode ? 'Edit Group' : 'Add Group'}
            showBackButton
            onBack={() => navigate('/settings/groups')}
            disableBox
          />
          
          {/* Action Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <SaveIcon fontSize="small" />}
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update Group' : 'Create Group'}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Content Area with Scroll */}
      <Box sx={getContentSectionStyles()}>
        <Paper
          sx={{
            p: 0,
            borderRadius: 0,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
          }}
        >
          {/* Basic Fields Section */}
          <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              Basic Information
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Group Name */}
              <Box sx={{ maxWidth: 600 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ fontWeight: 600, color: 'text.primary' }}
                  >
                    Group Name <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                  </Typography>
                  {isEditMode && groupData && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>{groupData.users?.length || 0}</strong> user(s) assigned
                    </Typography>
                  )}
                </Box>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: 'Group name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      placeholder="e.g., Sales Team"
                      fullWidth
                      size="small"
                      error={!!errors.name}
                      helperText={errors.name?.message}
                      disabled={isSubmitting}
                    />
                  )}
                />
              </Box>
            </Box>
          </Box>

          {/* Apps and Permissions Section */}
          <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Left: Apps List */}
            <Box
              sx={{
                width: '25%',
                minWidth: 200,
                borderRight: '1px solid #e0e0e0',
                overflow: 'auto',
                bgcolor: 'background.default',
              }}
            >
              <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', bgcolor: 'background.paper' }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  Applications
                </Typography>
              </Box>
              <List component="nav" disablePadding>
                {filteredApps.map((app) => {
                  const isAppExpanded = expandedApps.has(app.id);
                  const contentTypes = app.contenttypedetails?.filter((ct) => ct.permissions?.length > 0) || [];

                  return (
                    <React.Fragment key={app.id}>
                      <ListItemButton
                        onClick={() => {
                          setExpandedApps((prev) => {
                            const newSet = new Set(prev);
                            if (newSet.has(app.id)) {
                              newSet.delete(app.id);
                            } else {
                              newSet.add(app.id);
                            }
                            return newSet;
                          });
                          setSelectedAppId(app.id);
                          setExpandedContentTypes(new Set(contentTypes.map((ct) => ct.id)));
                        }}
                        sx={{
                          '&.Mui-selected': {
                            bgcolor: 'action.selected',
                            color: 'text.primary',
                            '& .MuiListItemText-primary': {
                              color: 'text.primary',
                            },
                          },
                          '&:hover': {
                            bgcolor: 'action.hover',
                          },
                        }}
                        selected={selectedAppId === app.id && !isAppExpanded}
                      >
                        <ListItemText
                          primary={app.name}
                          primaryTypographyProps={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: 'text.primary',
                          }}
                        />
                        {contentTypes.length > 0 && (
                          isAppExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />
                        )}
                      </ListItemButton>
                      {contentTypes.length > 0 && (
                        <Collapse in={isAppExpanded} timeout="auto" unmountOnExit>
                          <List component="div" disablePadding>
                            {contentTypes.map((ct) => (
                              <ListItemButton
                                key={ct.id}
                                selected={selectedAppId === app.id && expandedContentTypes.has(ct.id) && expandedContentTypes.size === 1}
                                onClick={() => {
                                  setSelectedAppId(app.id);
                                  setExpandedContentTypes(new Set([ct.id]));
                                }}
                                sx={{
                                  pl: 4,
                                  '&.Mui-selected': {
                                    bgcolor: 'action.selected',
                                    color: 'text.primary',
                                    '& .MuiListItemText-primary': {
                                      color: 'text.primary',
                                    },
                                  },
                                  '&:hover': {
                                    bgcolor: 'action.hover',
                                  },
                                }}
                              >
                                <ListItemText
                                  primary={ct.name || ct.model}
                                  primaryTypographyProps={{
                                    fontSize: 13,
                                    color: 'text.primary',
                                  }}
                                />
                              </ListItemButton>
                            ))}
                          </List>
                        </Collapse>
                      )}
                    </React.Fragment>
                  );
                })}
              </List>
            </Box>

            {/* Right: Permissions by Content Type */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
              {selectedApp ? (
                <>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    {selectedApp.name} Permissions
                  </Typography>

                  {selectedApp.contenttypedetails
                    .filter((ct) => ct.permissions?.length > 0)
                    .map((ct) => {
                      const isExpanded = expandedContentTypes.has(ct.id);
                      const allChecked = ct.permissions.every((p) => selectedPermissions.has(p.id));
                      const someChecked = ct.permissions.some((p) => selectedPermissions.has(p.id));

                      return (
                        <Box key={ct.id} sx={{ mb: 2 }}>
                          {/* Content Type Header */}
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              cursor: 'pointer',
                              mb: 1,
                            }}
                            onClick={() => handleToggleContentType(ct.id)}
                          >
                            <Typography
                              variant="subtitle1"
                              sx={{ fontWeight: 600, color: 'primary.main' }}
                            >
                              {ct.name || ct.model}
                            </Typography>
                            {isExpanded ? (
                              <ExpandLess sx={{ ml: 0.5, fontSize: 20, color: 'primary.main' }} />
                            ) : (
                              <ExpandMore sx={{ ml: 0.5, fontSize: 20, color: 'primary.main' }} />
                            )}
                          </Box>

                          {/* Permissions Grid */}
                          <Collapse in={isExpanded}>
                            <Box
                              sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, minmax(120px, 1fr))',
                                gap: 1,
                                mb: 1,
                              }}
                            >
                              {ct.permissions.map((perm) => {
                                // Extract short label from codename (e.g., 'add_item' -> 'Add')
                                const match = perm.codename.match(/^([^_]+)_/);
                                const label = match
                                  ? match[1].charAt(0).toUpperCase() + match[1].slice(1)
                                  : perm.name;

                                return (
                                  <Box
                                    key={perm.id}
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      maxWidth: 160,
                                    }}
                                  >
                                    <Typography variant="body2">{label}</Typography>
                                    <Switch
                                      size="small"
                                      checked={selectedPermissions.has(perm.id)}
                                      onChange={() => handlePermissionToggle(perm.id)}
                                      disabled={isSubmitting}
                                    />
                                  </Box>
                                );
                              })}
                            </Box>
                            <Divider />
                          </Collapse>
                        </Box>
                      );
                    })}

                  <Divider sx={{ my: 2 }} />
                  <Typography variant="caption" color="text.secondary">
                    Total permissions selected: <strong>{selectedPermissions.size}</strong>
                  </Typography>
                </>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Typography variant="body2" color="text.secondary">
                    Select an application from the left to view and manage its permissions
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default GroupForm;
