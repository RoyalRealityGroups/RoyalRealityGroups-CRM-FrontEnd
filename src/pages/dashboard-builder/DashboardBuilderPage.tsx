/**
 * Dashboard Builder Page
 *
 * Drag-and-drop dashboard editor with widget configuration.
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  ArrowBack as ArrowLeft,
  Save,
  Add as Plus,
  Settings,
  Delete as Trash2,
  Visibility as Eye,
  VisibilityOff as EyeOff,
  HourglassEmpty as Loader2,
  DragIndicator as GripVertical,
  Close as X,
  People as Users,
  Dashboard as LayoutDashboard,
} from '@mui/icons-material'
import {
  Box,
  Button,
  IconButton,
  Typography,
  Drawer,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Chip,
  CircularProgress,
  Paper,
  Divider,
  Grid,
  Tabs,
  Tab,
  Card,
  CardContent,
  FormHelperText,
  Stack,
} from '@mui/material'
import { useToast } from '../../hooks/useToast'

import {
  dashboardsApi,
  dashboardWidgetsApi,
  dashboardRolesApi,
  widgetTypesApi,
} from '../../api/dashboards.api';
import type { 
  Dashboard,
  DashboardWidget,
  DashboardRole,
  WidgetType,
  DashboardListItem,
}from '../../api/dashboards.api'
import WidgetRenderer from '../../components/dashboards/WidgetRenderer'
import { rolesApi, } from '../../api/users.api';
import type{ Role } from '../../api/users.api';
import { projectsApi, } from '../../api/projects';
import type { Project } from '../../api/projects';
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

const DashboardBuilderPage = () => {
  const { dashboardId } = useParams<{ dashboardId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [dashboards, setDashboards] = useState<DashboardListItem[]>([])
  const [widgets, setWidgets] = useState<DashboardWidget[]>([])
  const [widgetTypes, setWidgetTypes] = useState<WidgetType[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  // Panel states
  const [showWidgetPanel, setShowWidgetPanel] = useState(false)
  const [showSettingsPanel, setShowSettingsPanel] = useState(false)
  const [showRoleAssignPanel, setShowRoleAssignPanel] = useState(false)
  const [selectedWidget, setSelectedWidget] = useState<DashboardWidget | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Widget being added
  const [addingWidget, setAddingWidget] = useState(false)

  // Role assignment states
  const [roles, setRoles] = useState<Role[]>([])
  const [roleAssignments, setRoleAssignments] = useState<DashboardRole[]>([])
  const [loadingRoles, setLoadingRoles] = useState(false)
  const [assigningRole, setAssigningRole] = useState<string | null>(null)

  // Projects for filter dropdown
  const [projects, setProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(false)


  useEffect(() => {
    loadDashboards()
  }, [])

  useEffect(() => {
    if (dashboardId) {
      loadDashboard()
      loadWidgetTypes()
    }
  }, [dashboardId])

  // Load roles when panel opens
  useEffect(() => {
    if (showRoleAssignPanel) {
      loadRolesAndAssignments()
    }
  }, [showRoleAssignPanel])

  // Load projects when widget settings panel opens
  // useEffect(() => {
  //   if (selectedWidget && projects.length === 0) {
  //     loadProjects()
  //   }
  // }, [selectedWidget])

  const loadDashboards = async () => {
    try {
      const response = await dashboardsApi.list({ page_size: 100 })
      if (response.success && response.data) {
        setDashboards(response.data)
      }
    } catch (error) {
      console.error('Error loading dashboards:', error)
    }
  }

  const handleGoBack = () => {
    const fromDashboard = (location.state as any)?.fromDashboard
    if (fromDashboard) {
      navigate('/dashboard')
    } else {
      navigate('/dashboard-builder')
    }
  }

  const loadDashboard = async () => {
    if (!dashboardId) return

    setLoading(true)
    try {
      const response = await dashboardsApi.get(dashboardId)
      if (response.success && response.data) {
        setDashboard(response.data)
        setWidgets(response.data.widgets || [])
        // Load role assignments from dashboard response (use group_assignments from API)
        if (response.data.group_assignments) {
          setRoleAssignments(response.data.group_assignments)
        } else if (response.data.role_assignments) {
          setRoleAssignments(response.data.role_assignments)
        }
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadWidgetTypes = async () => {
    try {
      const response = await widgetTypesApi.list()
      if (response.success && response.data) {
        setWidgetTypes(response.data)
      }
    } catch (error) {
      console.error('Error loading widget types:', error)
    }
  }

  const loadRolesAndAssignments = async () => {
    if (!dashboardId) return

    setLoadingRoles(true)
    try {
      // Only load all available roles
      const rolesResponse = await rolesApi.list({ page_size: 100 })

      if (rolesResponse) {
        console.log('Loaded roles:', rolesResponse)
        setRoles((rolesResponse as any).results || [])
      }

      // Role assignments are already loaded from dashboard response
      // If not loaded yet, fetch them
      if (roleAssignments.length === 0) {
        const assignmentsResponse = await dashboardRolesApi.list({ dashboard: dashboardId })
        if (assignmentsResponse) {
          setRoleAssignments((assignmentsResponse as any).results || [])
        }
      }
      
      // Debug: Log assignments to see the structure
      console.log('Role assignments:', roleAssignments)
      console.log('Filtering logic check:', {
        roles: (rolesResponse as any)?.results?.map((r: any) => ({ id: r.id, name: r.name })),
        assignments: roleAssignments.map(a => ({ 
          id: a.id, 
          group: a.group, 
          role: a.role,
          group_name: a.group_name,
          role_name: a.role_name 
        }))
      })
    } catch (error) {
      console.error('Error loading roles:', error)
    } finally {
      setLoadingRoles(false)
    }
  }

  // const loadProjects = async () => {
  //   setLoadingProjects(true)
  //   try {
  //     const response = await projectsApi.list({ page_size: 100 })
  //     if (response.success && response.data) {
  //       setProjects(response.data)
  //     }
  //   } catch (error) {
  //     console.error('Error loading projects:', error)
  //   } finally {
  //     setLoadingProjects(false)
  //   }
  // }

  const handleAssignRole = async (roleId: string) => {
    if (!dashboardId) return

    setAssigningRole(roleId)
    try {
      const response = await dashboardRolesApi.create({
        dashboard: dashboardId,
        group: roleId,
        display_order: roleAssignments.length,
        is_default: roleAssignments.length === 0, // First assignment is default
        can_customize: false,
      })

      if (response.success && response.data) {
        setRoleAssignments([...roleAssignments, response.data])
      }
    } catch (error) {
      console.error('Error assigning role:', error)
    } finally {
      setAssigningRole(null)
    }
  }

  const handleUnassignRole = async (assignmentId: string) => {
    setAssigningRole(assignmentId)
    try {
      const response = await dashboardRolesApi.delete(assignmentId)

      if (response.success) {
        setRoleAssignments(roleAssignments.filter((a) => a.id !== assignmentId))
      }
    } catch (error) {
      console.error('Error unassigning role:', error)
    } finally {
      setAssigningRole(null)
    }
  }

  const handleAddWidget = async (widgetType: WidgetType) => {
    if (!dashboardId) return

    setAddingWidget(true)
    try {
      // Find next available position
      const maxY = widgets.reduce((max, w) => Math.max(max, w.position_y + w.height), 0)

      // Get default data source from widget type's available data sources
      const defaultDataSource = widgetType.available_data_sources?.[0] || ''

      const response = await dashboardWidgetsApi.create({
        dashboard: dashboardId,
        widget_type: widgetType.id,
        title: widgetType.name,
        position_x: 0,
        position_y: maxY,
        width: widgetType.default_width,
        height: widgetType.default_height,
        config: widgetType.default_config,
        data_source: defaultDataSource,
      })

      if (response.success && response.data) {
        setWidgets([...widgets, response.data])
        setShowWidgetPanel(false)
      }
    } catch (error) {
      console.error('Error adding widget:', error)
    } finally {
      setAddingWidget(false)
    }
  }

  const handleUpdateWidget = async (widgetId: string, updates: Partial<DashboardWidget>) => {
    try {
      const response = await dashboardWidgetsApi.update(widgetId, updates)
      if (response.success && response.data) {
        setWidgets(widgets.map((w) => (w.id === widgetId ? response.data : w)))
        if (selectedWidget?.id === widgetId) {
          setSelectedWidget(response.data)
        }
      }
    } catch (error) {
      console.error('Error updating widget:', error)
    }
  }

  const handleDeleteWidget = async (widgetId: string) => {
    try {
      const response = await dashboardWidgetsApi.delete(widgetId)
      if (response.success) {
        setWidgets(widgets.filter((w) => w.id !== widgetId))
        if (selectedWidget?.id === widgetId) {
          setSelectedWidget(null)
        }
      }
    } catch (error) {
      console.error('Error deleting widget:', error)
    }
  }

  const handleSaveLayout = async () => {
    if (!dashboardId) return

    setSaving(true)
    try {
      const layouts = widgets.map((w) => ({
        id: w.id,
        x: w.position_x,
        y: w.position_y,
        w: w.width,
        h: w.height,
      }))

      console.log('Saving layout:', layouts)
      const response = await dashboardWidgetsApi.updateLayout(dashboardId, layouts)
      console.log('Layout saved successfully:', response)
      
      toast.success('Layout saved successfully!')
    } catch (error) {
      console.error('Error saving layout:', error)
      toast.error('Failed to save layout. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateDashboard = async (updates: Partial<Dashboard>) => {
    if (!dashboardId || !dashboard) return

    try {
      // TODO: Implement dashboardsApi.update method
      // const response = await dashboardsApi.update(dashboardId, updates)
      // if (response.success && response.data) {
      //   setDashboard(response.data)
      // }
      
      // For now, update locally
      setDashboard({ ...dashboard, ...updates })
    } catch (error) {
      console.error('Error updating dashboard:', error)
    }
  }

  const filteredWidgetTypes =
    selectedCategory === 'all'
      ? widgetTypes
      : widgetTypes.filter((wt) => wt.category === selectedCategory)

  const categories = [
    { id: 'all', label: 'All Widgets' },
    { id: 'stats', label: 'Statistics' },
    { id: 'chart', label: 'Charts' },
    { id: 'table', label: 'Tables' },
    { id: 'list', label: 'Lists' },
    { id: 'custom', label: 'Custom' },
  ]

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!dashboard) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>Dashboard not found</Typography>
          <Button onClick={() => navigate('/dashboard-builder')} color="primary">
            Go back to dashboards
          </Button>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'grey.100', overflow: 'hidden' }}>
      {/* Header */}
      <Paper sx={{ borderRadius: 0, px: 2, py: 1.5 }} elevation={0}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={handleGoBack} size="small">
              <ArrowLeft />
            </IconButton>
            <Box>
              <Typography variant="h6">{dashboard.name}</Typography>
              <Typography variant="caption" color="text.secondary">{widgets.length} widgets</Typography>
            </Box>
          </Box>

          <Stack direction="row" spacing={1}>
            <Button
              startIcon={<Users />}
              onClick={() => setShowRoleAssignPanel(true)}
              size="small"
            >
              Assign Roles
            </Button>
            <Button
              startIcon={<Settings />}
              onClick={() => setShowSettingsPanel(true)}
              size="small"
            >
              Settings
            </Button>
            <Button
              startIcon={<Plus />}
              onClick={() => setShowWidgetPanel(true)}
              variant="contained"
              size="small"
            >
              Add Widget
            </Button>
            <Button
              startIcon={saving ? <CircularProgress size={16} /> : <Save />}
              onClick={handleSaveLayout}
              disabled={saving}
              variant="contained"
              color="success"
              size="small"
            >
              Save
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* Canvas */}
      <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
        {widgets.length === 0 ? (
          <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={{ textAlign: 'center' }}>
              <LayoutDashboard sx={{ fontSize: 48, color: 'grey.300', mx: 'auto' }} />
              <Typography variant="h6" sx={{ mt: 2 }}>No widgets yet</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Add widgets to build your dashboard
              </Typography>
              <Button
                startIcon={<Plus />}
                onClick={() => setShowWidgetPanel(true)}
                variant="contained"
                sx={{ mt: 2 }}
              >
                Add Widget
              </Button>
            </Box>
          </Box>
        ) : (
          <ResponsiveGridLayout
            className="layout"
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
            cols={{ lg: 24, md: 24, sm: 12, xs: 8 }}
             rowHeight={50}
            layouts={{
              lg: widgets.map((w) => ({
                i: w.id,
                x: w.position_x || 0,
                y: w.position_y || 0,
                w: w.width || 3,
                h: w.height || 2,
                minW: 1,
                minH: 1,
                maxW: 24,
                maxH: 24,
              })),
            }}
            onLayoutChange={(layout) => {
              console.log('Layout changed:', layout)
              setWidgets((prev) =>
                prev.map((widget) => {
                  const item = layout.find((l) => l.i === widget.id)
                  if (!item) return widget
                  const updated = {
                    ...widget,
                    position_x: item.x,
                    position_y: item.y,
                    width: item.w,
                    height: item.h,
                  }
                  console.log(`Widget ${widget.id} updated:`, { 
                    old: { x: widget.position_x, y: widget.position_y, w: widget.width, h: widget.height },
                    new: { x: item.x, y: item.y, w: item.w, h: item.h }
                  })
                  return updated
                })
              )
            }}
            draggableHandle=".drag-handle"
            isResizable={true}
            isDraggable={true}
            compactType="vertical"
            margin={[16, 16]}
          >
            {widgets.map((widget) => (
              <Paper
                key={widget.id}
                elevation={selectedWidget?.id === widget.id ? 4 : 1}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: selectedWidget?.id === widget.id ? 2 : 1,
                  borderColor: selectedWidget?.id === widget.id ? 'primary.main' : 'divider',
                  opacity: widget.is_visible ? 1 : 0.5,
                  '&:hover': { boxShadow: 3 },
                }}
                onClick={() => setSelectedWidget(widget)}
              >
                {/* Widget Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.5, py: 1, bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider' }}>
                  <Box className="drag-handle" sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'move', flex: 1, minWidth: 0, mr: 1 }}>
                    <GripVertical sx={{ fontSize: 16, color: 'text.disabled', flexShrink: 0 }} />
                    <Typography variant="body2" fontWeight="medium" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', wordBreak: 'break-word' }}>
                      {widget.title}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleUpdateWidget(widget.id, { is_visible: !widget.is_visible })
                      }}
                    >
                      {widget.is_visible ? <Eye sx={{ fontSize: 14 }} /> : <EyeOff sx={{ fontSize: 14 }} />}
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteWidget(widget.id)
                      }}
                    >
                      <Trash2 sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Box>
                </Box>

                {/* Widget Preview with Example Data */}
                <Box sx={{ flex: 1, overflow: 'hidden' }}>
                  <WidgetRenderer widget={widget} isPreview={true} />
                </Box>
              </Paper>
            ))}
          </ResponsiveGridLayout>
        )}
      </Box>

      {/* Add Widget Panel */}
      {showWidgetPanel && (
        <>
          <Box
            sx={{
              position: 'fixed',
              inset: 0,
              bgcolor: 'rgba(0, 0, 0, 0.3)',
              zIndex: 40,
            }}
            onClick={() => setShowWidgetPanel(false)}
          />
          <Box
            sx={{
              position: 'fixed',
              right: 0,
              top: 0,
              bottom: 0,
              width: 384,
              bgcolor: 'white',
              boxShadow: 24,
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6">Add Widget</Typography>
              <IconButton
                onClick={() => setShowWidgetPanel(false)}
                size="small"
              >
                <X />
              </IconButton>
            </Box>

            {/* Category Tabs */}
            <Box sx={{ display: 'flex', gap: 0.5, px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider', overflowX: 'auto' }}>
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  variant={selectedCategory === cat.id ? 'contained' : 'text'}
                  size="small"
                  sx={{ whiteSpace: 'nowrap', minWidth: 'auto' }}
                >
                  {cat.label}
                </Button>
              ))}
            </Box>

            {/* Widget List */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
              <Grid container spacing={1.5}>
                {filteredWidgetTypes.map((wt) => (
                  <Grid size={{ xs: 6 }} key={wt.id}>
                    <Paper
                      onClick={() => handleAddWidget(wt)}
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        opacity: addingWidget ? 0.5 : 1,
                        pointerEvents: addingWidget ? 'none' : 'auto',
                        '&:hover': { bgcolor: 'grey.100' },
                      }}
                    >
                      <Typography variant="body2" fontWeight="medium">{wt.name}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        {wt.description}
                      </Typography>
                      <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block' }}>
                        {wt.default_width}x{wt.default_height}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Box>
        </>
      )}

      {/* Settings Panel */}
      {showSettingsPanel && dashboard && (
        <>
          <Box
            sx={{
              position: 'fixed',
              inset: 0,
              bgcolor: 'rgba(0, 0, 0, 0.3)',
              zIndex: 40,
            }}
            onClick={() => setShowSettingsPanel(false)}
          />
          <Box
            sx={{
              position: 'fixed',
              right: 0,
              top: 0,
              bottom: 0,
              width: 384,
              bgcolor: 'white',
              boxShadow: 24,
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6">Dashboard Settings</Typography>
              <IconButton
                onClick={() => setShowSettingsPanel(false)}
                size="small"
              >
                <X />
              </IconButton>
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" fontWeight="medium" sx={{ mb: 0.5 }}>Name</Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={dashboard.name}
                    onChange={(e) => setDashboard({ ...dashboard, name: e.target.value })}
                    onBlur={() => handleUpdateDashboard({ name: dashboard.name })}
                  />
                </Box>

                <Box>
                  <Typography variant="body2" fontWeight="medium" sx={{ mb: 0.5 }}>Description</Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    size="small"
                    value={dashboard.description}
                    onChange={(e) => setDashboard({ ...dashboard, description: e.target.value })}
                    onBlur={() => handleUpdateDashboard({ description: dashboard.description })}
                  />
                </Box>

                <Box>
                  <Typography variant="body2" fontWeight="medium" sx={{ mb: 0.5 }}>Visibility</Typography>
                  <Select
                    fullWidth
                    size="small"
                    value={dashboard.visibility}
                    onChange={(e) => {
                      const visibility = e.target.value as 'private' | 'role' | 'organization'
                      setDashboard({ ...dashboard, visibility })
                      handleUpdateDashboard({ visibility })
                    }}
                  >
                    <MenuItem value="private">Private</MenuItem>
                    <MenuItem value="role">Role-Based</MenuItem>
                    <MenuItem value="organization">Organization</MenuItem>
                  </Select>
                </Box>

                <Box>
                  <Typography variant="body2" fontWeight="medium" sx={{ mb: 0.5 }}>
                    Auto-refresh (seconds)
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    size="small"
                    value={dashboard.refresh_interval}
                    onChange={(e) =>
                      setDashboard({ ...dashboard, refresh_interval: parseInt(e.target.value) || 0 })
                    }
                    onBlur={() =>
                      handleUpdateDashboard({ refresh_interval: dashboard.refresh_interval })
                    }
                    inputProps={{ min: 0 }}
                  />
                  <FormHelperText>Set to 0 to disable auto-refresh</FormHelperText>
                </Box>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={dashboard.is_default}
                      onChange={(e) => {
                        setDashboard({ ...dashboard, is_default: e.target.checked })
                        handleUpdateDashboard({ is_default: e.target.checked })
                      }}
                    />
                  }
                  label="Set as default dashboard"
                />
              </Stack>
            </Box>
          </Box>
        </>
      )}

      {/* Widget Config Panel */}
      {selectedWidget && (
        <>
          <Box
            sx={{
              position: 'fixed',
              inset: 0,
              bgcolor: 'rgba(0, 0, 0, 0.3)',
              zIndex: 40,
            }}
            onClick={() => setSelectedWidget(null)}
          />
          <Box
            sx={{
              position: 'fixed',
              right: 0,
              top: 0,
              bottom: 0,
              width: 320,
              bgcolor: 'white',
              boxShadow: 24,
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              borderLeft: 1,
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="body2" fontWeight="600">Widget Settings</Typography>
              <IconButton
                onClick={() => setSelectedWidget(null)}
                size="small"
              >
                <X sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>

          <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
            {/* Basic Settings Section */}
            <Box sx={{ pb: 1.5, borderBottom: 1, borderColor: 'grey.100', mb: 2 }}>
              <Typography variant="caption" fontWeight="600" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 1.5, display: 'block' }}>Basic</Typography>
              <Stack spacing={1.5}>
                <Box>
                  <Typography variant="caption" fontWeight="medium" sx={{ mb: 0.5, display: 'block' }}>Title</Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={selectedWidget.title}
                    onChange={(e) => setSelectedWidget({ ...selectedWidget, title: e.target.value })}
                    onBlur={() => handleUpdateWidget(selectedWidget.id, { title: selectedWidget.title })}
                  />
                </Box>

                <Box>
                  <Typography variant="caption" fontWeight="medium" sx={{ mb: 0.5, display: 'block' }}>Subtitle</Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={selectedWidget.subtitle || ''}
                    onChange={(e) => setSelectedWidget({ ...selectedWidget, subtitle: e.target.value })}
                    onBlur={() =>
                      handleUpdateWidget(selectedWidget.id, { subtitle: selectedWidget.subtitle })
                    }
                  />
                </Box>
              </Stack>
            </Box>

            {/* Size Settings Section */}
            <Box sx={{ pb: 1.5, borderBottom: 1, borderColor: 'grey.100', mb: 2 }}>
              <Typography variant="caption" fontWeight="600" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 1.5, display: 'block' }}>Size</Typography>
              <Grid container spacing={1}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" fontWeight="medium" sx={{ mb: 0.5, display: 'block' }}>Width (1-24)</Typography>
                  <TextField
                    fullWidth
                    type="number"
                    size="small"
                    value={selectedWidget.width}
                    onChange={(e) =>
                      setSelectedWidget({ ...selectedWidget, width: parseFloat(e.target.value) || 1 })
                    }
                    onBlur={() =>
                      handleUpdateWidget(selectedWidget.id, { width: selectedWidget.width })
                    }
                    inputProps={{ min: 1, max: 24, step: 1 }}
                  />
                  <FormHelperText>Use 3 for 1.5 columns (24-column grid)</FormHelperText>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" fontWeight="medium" sx={{ mb: 0.5, display: 'block' }}>Height (1-24)</Typography>
                  <TextField
                    fullWidth
                    type="number"
                    size="small"
                    value={selectedWidget.height}
                    onChange={(e) =>
                      setSelectedWidget({ ...selectedWidget, height: parseFloat(e.target.value) || 1 })
                    }
                    onBlur={() =>
                      handleUpdateWidget(selectedWidget.id, { height: selectedWidget.height })
                    }
                    inputProps={{ min: 1, max: 24, step: 1 }}
                  />
                  <FormHelperText>Use 3 for 1.5 rows (24-row grid)</FormHelperText>
                </Grid>
              </Grid>
            </Box>

            {/* Data Settings Section */}
            <Box sx={{ pb: 1.5, borderBottom: 1, borderColor: 'grey.100', mb: 2 }}>
              <Typography variant="caption" fontWeight="600" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 1.5, display: 'block' }}>Data</Typography>
              <Box>
                <Typography variant="caption" fontWeight="medium" sx={{ mb: 0.5, display: 'block' }}>Data Source</Typography>
                {(() => {
                  // Get the widget type to access available_data_sources
                  const widgetType = widgetTypes.find(wt => wt.id === (selectedWidget as any).widget_type)
                  const availableDataSources = widgetType?.available_data_sources || []

                  // Data source labels mapping
                  const dataSourceLabels: Record<string, string> = {
                    // Projects
                    'projects.count': 'Total Projects',
                    'projects.active_count': 'Active Projects',
                    'projects.by_status': 'Projects by Status',
                    'projects.recent': 'Recent Projects',
                    // Tasks
                    'tasks.count': 'Total Tasks',
                    'tasks.completed_count': 'Completed Tasks',
                    'tasks.overdue_count': 'Overdue Tasks',
                    'tasks.in_progress_count': 'In Progress Tasks',
                    'tasks.by_status': 'Tasks by Status',
                    'tasks.by_priority': 'Tasks by Priority',
                    'tasks.list': 'Task List (Table)',
                    'tasks.recent': 'Recent Tasks',
                    'tasks.my_tasks': 'My Tasks',
                    // Requirements
                    'requirements.count': 'Total Requirements',
                    'requirements.approved_count': 'Approved Requirements',
                    'requirements.by_status': 'Requirements by Status',
                    // Users
                    'users.count': 'Team Members',
                    'users.active_count': 'Active Users',
                    // Todos
                    'todos.count': 'Total Todos',
                    'todos.pending_count': 'Pending Todos',
                    'todos.completed_count': 'Completed Todos',
                    'todos.overdue_count': 'Overdue Todos',
                    'todos.by_status': 'Todos by Status',
                    'todos.by_priority': 'Todos by Priority',
                    'todos.recent': 'Recent Todos',
                    'todos.my_todos': 'My Todos',
                    // Activity & Alerts
                    'activity.recent': 'Recent Activity',
                    'alerts.overview': 'System Alerts',
                    // Custom
                    'custom': 'Custom Data Source',
                  }

                  // Filter data sources based on widget type's available sources
                  const filteredSources = availableDataSources.length > 0
                    ? availableDataSources.filter((ds: string) => ds !== 'custom')
                    : Object.keys(dataSourceLabels).filter(ds => ds !== 'custom')

                  return (
                    <Select
                      fullWidth
                      size="small"
                      value={selectedWidget.data_source || ''}
                      onChange={(e) => {
                        setSelectedWidget({ ...selectedWidget, data_source: e.target.value })
                        handleUpdateWidget(selectedWidget.id, { data_source: e.target.value })
                      }}
                    >
                      <MenuItem value="">Select data source...</MenuItem>
                      {filteredSources.map((ds: string) => (
                        <MenuItem key={ds} value={ds}>
                          {dataSourceLabels[ds] || ds}
                        </MenuItem>
                      ))}
                    </Select>
                  )
                })()}
              </Box>
            </Box>

            {/* Filters Section */}
            <Box sx={{ pb: 1.5, borderBottom: 1, borderColor: 'grey.100', mb: 2 }}>
              <Typography variant="caption" fontWeight="600" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 1.5, display: 'block' }}>Filters</Typography>
              <Stack spacing={1.5}>
                {/* Project Filter */}
                <Box>
                  <Typography variant="caption" fontWeight="medium" sx={{ mb: 0.5, display: 'block' }}>Project</Typography>
                  <Select
                    fullWidth
                    size="small"
                    value={selectedWidget.filters?.project_id || ''}
                    onChange={(e) => {
                      const newFilters = { ...(selectedWidget.filters || {}), project_id: e.target.value || undefined }
                      if (!e.target.value) delete newFilters.project_id
                      setSelectedWidget({ ...selectedWidget, filters: newFilters })
                      handleUpdateWidget(selectedWidget.id, { filters: newFilters })
                    }}
                    disabled={loadingProjects}
                  >
                    <MenuItem value="">All Projects</MenuItem>
                    {projects.map((project) => (
                      <MenuItem key={project.id} value={project.id}>
                        {project.code} - {project.name}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>

                {/* Date Range Filter */}
                <Box>
                  <Typography variant="caption" fontWeight="medium" sx={{ mb: 0.5, display: 'block' }}>Date Range</Typography>
                  <Select
                    fullWidth
                    size="small"
                    value={selectedWidget.filters?.date_range || 'all'}
                    onChange={(e) => {
                      const newFilters: Record<string, any> = {
                        ...(selectedWidget.filters || {}),
                        date_range: e.target.value === 'all' ? undefined : e.target.value,
                      }
                      if (e.target.value === 'all') delete newFilters.date_range
                      if (e.target.value !== 'custom') {
                        delete newFilters.start_date
                        delete newFilters.end_date
                      }
                      setSelectedWidget({ ...selectedWidget, filters: newFilters })
                      handleUpdateWidget(selectedWidget.id, { filters: newFilters })
                    }}
                  >
                    <MenuItem value="all">All Time</MenuItem>
                    <MenuItem value="today">Today</MenuItem>
                    <MenuItem value="this_week">This Week</MenuItem>
                    <MenuItem value="this_month">This Month</MenuItem>
                    <MenuItem value="last_30_days">Last 30 Days</MenuItem>
                    <MenuItem value="custom">Custom Range</MenuItem>
                  </Select>
                </Box>

                {/* Custom Date Range Inputs */}
                {selectedWidget.filters?.date_range === 'custom' && (
                  <Grid container spacing={1}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Start Date</Typography>
                      <TextField
                        fullWidth
                        type="date"
                        size="small"
                        value={selectedWidget.filters?.start_date || ''}
                        onChange={(e) => {
                          const newFilters = { ...(selectedWidget.filters || {}), start_date: e.target.value || undefined }
                          if (!e.target.value) delete newFilters.start_date
                          setSelectedWidget({ ...selectedWidget, filters: newFilters })
                        }}
                        onBlur={() => handleUpdateWidget(selectedWidget.id, { filters: selectedWidget.filters })}
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>End Date</Typography>
                      <TextField
                        fullWidth
                        type="date"
                        size="small"
                        value={selectedWidget.filters?.end_date || ''}
                        onChange={(e) => {
                          const newFilters = { ...(selectedWidget.filters || {}), end_date: e.target.value || undefined }
                          if (!e.target.value) delete newFilters.end_date
                          setSelectedWidget({ ...selectedWidget, filters: newFilters })
                        }}
                        onBlur={() => handleUpdateWidget(selectedWidget.id, { filters: selectedWidget.filters })}
                      />
                    </Grid>
                  </Grid>
                )}

                {/* Status Filter (for tasks) */}
                {selectedWidget.data_source?.startsWith('tasks.') && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Task Status</label>
                    <div className="space-y-1">
                      {[
                        { value: 'backlog', label: 'Not Started' },
                        { value: 'todo', label: 'To Do' },
                        { value: 'in_progress', label: 'In Progress' },
                        { value: 'in_review', label: 'In Review' },
                        { value: 'done', label: 'Done' },
                      ].map((status) => {
                        const currentStatuses = selectedWidget.filters?.status || []
                        const isChecked = currentStatuses.includes(status.value)
                        return (
                          <label key={status.value} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                let newStatuses = [...currentStatuses]
                                if (e.target.checked) {
                                  newStatuses.push(status.value)
                                } else {
                                  newStatuses = newStatuses.filter((s) => s !== status.value)
                                }
                                const newFilters = {
                                  ...(selectedWidget.filters || {}),
                                  status: newStatuses.length > 0 ? newStatuses : undefined,
                                }
                                if (newStatuses.length === 0) delete newFilters.status
                                setSelectedWidget({ ...selectedWidget, filters: newFilters })
                                handleUpdateWidget(selectedWidget.id, { filters: newFilters })
                              }}
                              className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-xs text-gray-700">{status.label}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Priority Filter (for tasks) */}
                {selectedWidget.data_source?.startsWith('tasks.') && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Task Priority</label>
                    <div className="space-y-1">
                      {[
                        { value: 'critical', label: 'Critical', color: 'bg-red-500' },
                        { value: 'high', label: 'High', color: 'bg-orange-500' },
                        { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
                        { value: 'low', label: 'Low', color: 'bg-blue-500' },
                        { value: 'lowest', label: 'Lowest', color: 'bg-gray-400' },
                      ].map((priority) => {
                        const currentPriorities = selectedWidget.filters?.priority || []
                        const isChecked = currentPriorities.includes(priority.value)
                        return (
                          <label key={priority.value} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                let newPriorities = [...currentPriorities]
                                if (e.target.checked) {
                                  newPriorities.push(priority.value)
                                } else {
                                  newPriorities = newPriorities.filter((p) => p !== priority.value)
                                }
                                const newFilters = {
                                  ...(selectedWidget.filters || {}),
                                  priority: newPriorities.length > 0 ? newPriorities : undefined,
                                }
                                if (newPriorities.length === 0) delete newFilters.priority
                                setSelectedWidget({ ...selectedWidget, filters: newFilters })
                                handleUpdateWidget(selectedWidget.id, { filters: newFilters })
                              }}
                              className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className={`w-2 h-2 rounded-full ${priority.color}`} />
                            <span className="text-xs text-gray-700">{priority.label}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Status Filter (for todos) */}
                {selectedWidget.data_source?.startsWith('todos.') && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Todo Status</label>
                    <div className="space-y-1">
                      {[
                        { value: 'pending', label: 'Pending' },
                        { value: 'in_progress', label: 'In Progress' },
                        { value: 'completed', label: 'Completed' },
                        { value: 'cancelled', label: 'Cancelled' },
                        { value: 'on_hold', label: 'On Hold' },
                      ].map((status) => {
                        const currentStatuses = selectedWidget.filters?.status || []
                        const isChecked = currentStatuses.includes(status.value)
                        return (
                          <label key={status.value} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                let newStatuses = [...currentStatuses]
                                if (e.target.checked) {
                                  newStatuses.push(status.value)
                                } else {
                                  newStatuses = newStatuses.filter((s) => s !== status.value)
                                }
                                const newFilters = {
                                  ...(selectedWidget.filters || {}),
                                  status: newStatuses.length > 0 ? newStatuses : undefined,
                                }
                                if (newStatuses.length === 0) delete newFilters.status
                                setSelectedWidget({ ...selectedWidget, filters: newFilters })
                                handleUpdateWidget(selectedWidget.id, { filters: newFilters })
                              }}
                              className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-xs text-gray-700">{status.label}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Priority Filter (for todos) */}
                {selectedWidget.data_source?.startsWith('todos.') && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Todo Priority</label>
                    <div className="space-y-1">
                      {[
                        { value: 'urgent', label: 'Urgent', color: 'bg-red-500' },
                        { value: 'high', label: 'High', color: 'bg-orange-500' },
                        { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
                        { value: 'low', label: 'Low', color: 'bg-blue-500' },
                      ].map((priority) => {
                        const currentPriorities = selectedWidget.filters?.priority || []
                        const isChecked = currentPriorities.includes(priority.value)
                        return (
                          <label key={priority.value} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                let newPriorities = [...currentPriorities]
                                if (e.target.checked) {
                                  newPriorities.push(priority.value)
                                } else {
                                  newPriorities = newPriorities.filter((p) => p !== priority.value)
                                }
                                const newFilters = {
                                  ...(selectedWidget.filters || {}),
                                  priority: newPriorities.length > 0 ? newPriorities : undefined,
                                }
                                if (newPriorities.length === 0) delete newFilters.priority
                                setSelectedWidget({ ...selectedWidget, filters: newFilters })
                                handleUpdateWidget(selectedWidget.id, { filters: newFilters })
                              }}
                              className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className={`w-2 h-2 rounded-full ${priority.color}`} />
                            <span className="text-xs text-gray-700">{priority.label}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Assigned to Me Filter (for todos) */}
                {selectedWidget.data_source?.startsWith('todos.') && selectedWidget.data_source !== 'todos.my_todos' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="assignedToMeTodos"
                      checked={selectedWidget.filters?.assigned_to_me === true}
                      onChange={(e) => {
                        const newFilters = {
                          ...(selectedWidget.filters || {}),
                          assigned_to_me: e.target.checked || undefined,
                        }
                        if (!e.target.checked) delete newFilters.assigned_to_me
                        setSelectedWidget({ ...selectedWidget, filters: newFilters })
                        handleUpdateWidget(selectedWidget.id, { filters: newFilters })
                      }}
                      className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="assignedToMeTodos" className="text-xs text-gray-700">
                      Only show my todos
                    </label>
                  </div>
                )}

                {/* Assigned to Me Filter (for tasks) */}
                {selectedWidget.data_source?.startsWith('tasks.') && selectedWidget.data_source !== 'tasks.my_tasks' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="assignedToMe"
                      checked={selectedWidget.filters?.assigned_to_me === true}
                      onChange={(e) => {
                        const newFilters = {
                          ...(selectedWidget.filters || {}),
                          assigned_to_me: e.target.checked || undefined,
                        }
                        if (!e.target.checked) delete newFilters.assigned_to_me
                        setSelectedWidget({ ...selectedWidget, filters: newFilters })
                        handleUpdateWidget(selectedWidget.id, { filters: newFilters })
                      }}
                      className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="assignedToMe" className="text-xs text-gray-700">
                      Only show my tasks
                    </label>
                  </div>
                )}

                {/* Limit Filter */}
                <Box>
                  <Typography variant="caption" fontWeight="medium" sx={{ mb: 0.5, display: 'block' }}>Max Items</Typography>
                  <TextField
                    fullWidth
                    type="number"
                    size="small"
                    value={selectedWidget.filters?.limit || ''}
                    onChange={(e) => {
                      const newFilters = {
                        ...(selectedWidget.filters || {}),
                        limit: e.target.value ? parseInt(e.target.value) : undefined,
                      }
                      if (!e.target.value) delete newFilters.limit
                      setSelectedWidget({ ...selectedWidget, filters: newFilters })
                    }}
                    onBlur={() => handleUpdateWidget(selectedWidget.id, { filters: selectedWidget.filters })}
                    placeholder="Default (5)"
                    inputProps={{ min: 1, max: 50 }}
                  />
                  <FormHelperText>For list-type widgets</FormHelperText>
                </Box>

                {/* Clear Filters Button */}
                {selectedWidget.filters && Object.keys(selectedWidget.filters).length > 0 && (
                  <button
                    onClick={() => {
                      setSelectedWidget({ ...selectedWidget, filters: {} })
                      handleUpdateWidget(selectedWidget.id, { filters: {} })
                    }}
                    className="w-full px-2 py-1.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    Clear All Filters
                  </button>
                )}
              </Stack>
            </Box>

            {/* Style Settings Section */}
            <Box sx={{ pb: 1.5, borderBottom: 1, borderColor: 'grey.100', mb: 2 }}>
              <Typography variant="caption" fontWeight="600" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 1.5, display: 'block' }}>Style</Typography>
              <Stack spacing={1.5}>
                <Box>
                  <Typography variant="caption" fontWeight="medium" sx={{ mb: 1, display: 'block' }}>Color Theme</Typography>
                  <Grid container spacing={1}>
                    {[
                      { id: 'blue', color: '#3b82f6' },
                      { id: 'green', color: '#22c55e' },
                      { id: 'purple', color: '#a855f7' },
                      { id: 'orange', color: '#f97316' },
                      { id: 'pink', color: '#ec4899' },
                      { id: 'cyan', color: '#06b6d4' },
                      { id: 'indigo', color: '#6366f1' },
                      { id: 'gray', color: '#6b7280' },
                    ].map((theme) => (
                      <Grid size={{ xs: 3 }} key={theme.id}>
                        <Box
                          onClick={() => {
                            const newConfig = { ...(selectedWidget.config || {}), colorTheme: theme.id }
                            setSelectedWidget({ ...selectedWidget, config: newConfig })
                            handleUpdateWidget(selectedWidget.id, { config: newConfig })
                          }}
                          sx={{
                            width: '100%',
                            height: 32,
                            borderRadius: 1,
                            bgcolor: theme.color,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            border: (selectedWidget.config?.colorTheme || 'blue') === theme.id ? 2 : 0,
                            borderColor: 'grey.900',
                            '&:hover': { opacity: 0.8 }
                          }}
                          title={theme.id}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>

                <Box>
                  <Typography variant="caption" fontWeight="medium" sx={{ mb: 0.5, display: 'block' }}>Header Style</Typography>
                  <Select
                    fullWidth
                    size="small"
                    value={selectedWidget.config?.headerStyle || 'default'}
                    onChange={(e) => {
                      const newConfig = { ...(selectedWidget.config || {}), headerStyle: e.target.value }
                      setSelectedWidget({ ...selectedWidget, config: newConfig })
                      handleUpdateWidget(selectedWidget.id, { config: newConfig })
                    }}
                  >
                    <MenuItem value="default">Default (White)</MenuItem>
                    <MenuItem value="colored">Colored</MenuItem>
                    <MenuItem value="minimal">Minimal</MenuItem>
                  </Select>
                </Box>

                <FormControlLabel
                  control={
                    <Checkbox
                      id="showHeader"
                    checked={selectedWidget.config?.showHeader !== false}
                    onChange={(e) => {
                      const newConfig = { ...(selectedWidget.config || {}), showHeader: e.target.checked }
                      setSelectedWidget({ ...selectedWidget, config: newConfig })
                      handleUpdateWidget(selectedWidget.id, { config: newConfig })
                    }}
                  />
                  }
                  label="Show widget header"
                />
              </Stack>
            </Box>

            {/* Widget-specific Options Section */}
            <Box sx={{ pb: 1.5, borderBottom: 1, borderColor: 'grey.100', mb: 2 }}>
              <Typography variant="caption" fontWeight="600" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 1.5, display: 'block' }}>Options</Typography>
              <Stack spacing={1}>
                {/* Refresh Button Toggle (available for all widget types with data sources) */}
                {selectedWidget.data_source && (
                  <FormControlLabel
                    control={
                      <Checkbox
                        id="showRefresh"
                        checked={selectedWidget.config?.showRefresh === true}
                        onChange={(e) => {
                          const newConfig = { ...(selectedWidget.config || {}), showRefresh: e.target.checked }
                          setSelectedWidget({ ...selectedWidget, config: newConfig })
                          handleUpdateWidget(selectedWidget.id, { config: newConfig })
                        }}
                      />
                    }
                    label="Show refresh button"
                  />
                )}

                {/* Stats Card Options */}
                {selectedWidget.widget_type_code === 'stats_card' && (
                  <>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="showTrend"
                        checked={selectedWidget.config?.showTrend !== false}
                        onChange={(e) => {
                          const newConfig = { ...(selectedWidget.config || {}), showTrend: e.target.checked }
                          setSelectedWidget({ ...selectedWidget, config: newConfig })
                          handleUpdateWidget(selectedWidget.id, { config: newConfig })
                        }}
                        className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="showTrend" className="text-xs text-gray-700">
                        Show trend indicator
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="showProgress"
                        checked={selectedWidget.config?.showProgress === true}
                        onChange={(e) => {
                          const newConfig = { ...(selectedWidget.config || {}), showProgress: e.target.checked }
                          setSelectedWidget({ ...selectedWidget, config: newConfig })
                          handleUpdateWidget(selectedWidget.id, { config: newConfig })
                        }}
                        className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="showProgress" className="text-xs text-gray-700">
                        Show progress bar
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Prefix</label>
                        <input
                          type="text"
                          value={selectedWidget.config?.prefix || ''}
                          onChange={(e) => {
                            const newConfig = { ...(selectedWidget.config || {}), prefix: e.target.value }
                            setSelectedWidget({ ...selectedWidget, config: newConfig })
                          }}
                          onBlur={() => handleUpdateWidget(selectedWidget.id, { config: selectedWidget.config })}
                          placeholder="$"
                          className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Suffix</label>
                        <input
                          type="text"
                          value={selectedWidget.config?.suffix || ''}
                          onChange={(e) => {
                            const newConfig = { ...(selectedWidget.config || {}), suffix: e.target.value }
                            setSelectedWidget({ ...selectedWidget, config: newConfig })
                          }}
                          onBlur={() => handleUpdateWidget(selectedWidget.id, { config: selectedWidget.config })}
                          placeholder="%"
                          className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Bar Chart Options */}
                {selectedWidget.widget_type_code === 'bar_chart' && (
                  <>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="showValues"
                        checked={selectedWidget.config?.showValues !== false}
                        onChange={(e) => {
                          const newConfig = { ...(selectedWidget.config || {}), showValues: e.target.checked }
                          setSelectedWidget({ ...selectedWidget, config: newConfig })
                          handleUpdateWidget(selectedWidget.id, { config: newConfig })
                        }}
                        className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="showValues" className="text-xs text-gray-700">
                        Show values
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="showLegend"
                        checked={selectedWidget.config?.showLegend !== false}
                        onChange={(e) => {
                          const newConfig = { ...(selectedWidget.config || {}), showLegend: e.target.checked }
                          setSelectedWidget({ ...selectedWidget, config: newConfig })
                          handleUpdateWidget(selectedWidget.id, { config: newConfig })
                        }}
                        className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="showLegend" className="text-xs text-gray-700">
                        Show legend
                      </label>
                    </div>
                  </>
                )}

                {/* Task/Project List Options */}
                {(selectedWidget.widget_type_code === 'task_list' || selectedWidget.widget_type_code === 'project_list') && (
                  <>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="showCode"
                        checked={selectedWidget.config?.showCode !== false}
                        onChange={(e) => {
                          const newConfig = { ...(selectedWidget.config || {}), showCode: e.target.checked }
                          setSelectedWidget({ ...selectedWidget, config: newConfig })
                          handleUpdateWidget(selectedWidget.id, { config: newConfig })
                        }}
                        className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="showCode" className="text-xs text-gray-700">
                        Show item codes
                      </label>
                    </div>
                    {selectedWidget.widget_type_code === 'task_list' && (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="showPriority"
                          checked={selectedWidget.config?.showPriority !== false}
                          onChange={(e) => {
                            const newConfig = { ...(selectedWidget.config || {}), showPriority: e.target.checked }
                            setSelectedWidget({ ...selectedWidget, config: newConfig })
                            handleUpdateWidget(selectedWidget.id, { config: newConfig })
                          }}
                          className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="showPriority" className="text-xs text-gray-700">
                          Show priority indicator
                        </label>
                      </div>
                    )}
                    {selectedWidget.widget_type_code === 'project_list' && (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="showProjectProgress"
                          checked={selectedWidget.config?.showProgress !== false}
                          onChange={(e) => {
                            const newConfig = { ...(selectedWidget.config || {}), showProgress: e.target.checked }
                            setSelectedWidget({ ...selectedWidget, config: newConfig })
                            handleUpdateWidget(selectedWidget.id, { config: newConfig })
                          }}
                          className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="showProjectProgress" className="text-xs text-gray-700">
                          Show progress bars
                        </label>
                      </div>
                    )}
                  </>
                )}

                {/* Activity Feed Options */}
                {selectedWidget.widget_type_code === 'activity_feed' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="showTimeline"
                      checked={selectedWidget.config?.showTimeline !== false}
                      onChange={(e) => {
                        const newConfig = { ...(selectedWidget.config || {}), showTimeline: e.target.checked }
                        setSelectedWidget({ ...selectedWidget, config: newConfig })
                        handleUpdateWidget(selectedWidget.id, { config: newConfig })
                      }}
                      className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="showTimeline" className="text-xs text-gray-700">
                      Show timeline connector
                    </label>
                  </div>
                )}

                {/* Todo List Options */}
                {selectedWidget.widget_type_code === 'todo_list' && (
                  <>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="showTodoPriority"
                        checked={selectedWidget.config?.showPriority !== false}
                        onChange={(e) => {
                          const newConfig = { ...(selectedWidget.config || {}), showPriority: e.target.checked }
                          setSelectedWidget({ ...selectedWidget, config: newConfig })
                          handleUpdateWidget(selectedWidget.id, { config: newConfig })
                        }}
                        className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="showTodoPriority" className="text-xs text-gray-700">
                        Show priority indicator
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="showTodoDueDate"
                        checked={selectedWidget.config?.showDueDate !== false}
                        onChange={(e) => {
                          const newConfig = { ...(selectedWidget.config || {}), showDueDate: e.target.checked }
                          setSelectedWidget({ ...selectedWidget, config: newConfig })
                          handleUpdateWidget(selectedWidget.id, { config: newConfig })
                        }}
                        className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="showTodoDueDate" className="text-xs text-gray-700">
                        Show due date
                      </label>
                    </div>
                  </>
                )}

                {/* Alerts List Options */}
                {selectedWidget.widget_type_code === 'alerts_list' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="showTimestamp"
                      checked={selectedWidget.config?.showTimestamp !== false}
                      onChange={(e) => {
                        const newConfig = { ...(selectedWidget.config || {}), showTimestamp: e.target.checked }
                        setSelectedWidget({ ...selectedWidget, config: newConfig })
                        handleUpdateWidget(selectedWidget.id, { config: newConfig })
                      }}
                      className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="showTimestamp" className="text-xs text-gray-700">
                      Show timestamps
                    </label>
                  </div>
                )}

                {/* Welcome Card Options */}
                {selectedWidget.widget_type_code === 'welcome_card' && (
                  <>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="showGreeting"
                        checked={selectedWidget.config?.showGreeting !== false}
                        onChange={(e) => {
                          const newConfig = { ...(selectedWidget.config || {}), showGreeting: e.target.checked }
                          setSelectedWidget({ ...selectedWidget, config: newConfig })
                          handleUpdateWidget(selectedWidget.id, { config: newConfig })
                        }}
                        className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="showGreeting" className="text-xs text-gray-700">
                        Show greeting
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="showDate"
                        checked={selectedWidget.config?.showDate !== false}
                        onChange={(e) => {
                          const newConfig = { ...(selectedWidget.config || {}), showDate: e.target.checked }
                          setSelectedWidget({ ...selectedWidget, config: newConfig })
                          handleUpdateWidget(selectedWidget.id, { config: newConfig })
                        }}
                        className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="showDate" className="text-xs text-gray-700">
                        Show date
                      </label>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Custom Message</label>
                      <input
                        type="text"
                        value={selectedWidget.config?.message || ''}
                        onChange={(e) => {
                          const newConfig = { ...(selectedWidget.config || {}), message: e.target.value }
                          setSelectedWidget({ ...selectedWidget, config: newConfig })
                        }}
                        onBlur={() => handleUpdateWidget(selectedWidget.id, { config: selectedWidget.config })}
                        placeholder="Have a great day!"
                        className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}

                {/* Stats Counter Options */}
                {selectedWidget.widget_type_code === 'stats_counter' && (
                  <Grid container spacing={1}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Prefix</Typography>
                      <TextField
                        fullWidth
                        size="small"
                        type="text"
                        value={selectedWidget.config?.prefix || ''}
                        onChange={(e) => {
                          const newConfig = { ...(selectedWidget.config || {}), prefix: e.target.value }
                          setSelectedWidget({ ...selectedWidget, config: newConfig })
                        }}
                        onBlur={() => handleUpdateWidget(selectedWidget.id, { config: selectedWidget.config })}
                        placeholder="$"
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Suffix</Typography>
                      <TextField
                        fullWidth
                        size="small"
                        type="text"
                        value={selectedWidget.config?.suffix || ''}
                        onChange={(e) => {
                          const newConfig = { ...(selectedWidget.config || {}), suffix: e.target.value }
                          setSelectedWidget({ ...selectedWidget, config: newConfig })
                        }}
                        onBlur={() => handleUpdateWidget(selectedWidget.id, { config: selectedWidget.config })}
                        placeholder="%"
                      />
                    </Grid>
                  </Grid>
                )}

                {/* Quick Actions Options */}
                {selectedWidget.widget_type_code === 'quick_actions' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Layout</label>
                    <select
                      value={selectedWidget.config?.layout || 'grid'}
                      onChange={(e) => {
                        const newConfig = { ...(selectedWidget.config || {}), layout: e.target.value }
                        setSelectedWidget({ ...selectedWidget, config: newConfig })
                        handleUpdateWidget(selectedWidget.id, { config: newConfig })
                      }}
                      className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="grid">Grid (2 columns)</option>
                      <option value="list">List (stacked)</option>
                    </select>
                  </div>
                )}

                {/* Default message for widgets without specific options */}
                {!['stats_card', 'stats_counter', 'bar_chart', 'task_list', 'todo_list', 'project_list', 'activity_feed', 'alerts_list', 'welcome_card', 'quick_actions'].includes(selectedWidget.widget_type_code || '') && (
                  <Typography variant="caption" color="text.disabled" fontStyle="italic">No additional options for this widget type.</Typography>
                )}
              </Stack>
            </Box>

            {/* Delete Button */}
            <Button
              fullWidth
              variant="outlined"
              color="error"
              startIcon={<Trash2 />}
              onClick={() => handleDeleteWidget(selectedWidget.id)}
            >
              Remove Widget
            </Button>
          </Box>
          </Box>
        </>
      )}

      {/* Role Assignment Panel */}
      {showRoleAssignPanel && (
        <>
          <Box
            sx={{
              position: 'fixed',
              inset: 0,
              bgcolor: 'rgba(0, 0, 0, 0.3)',
              zIndex: 40,
            }}
            onClick={() => setShowRoleAssignPanel(false)}
          />
          <Box
            sx={{
              position: 'fixed',
              right: 0,
              top: 0,
              bottom: 0,
              width: 384,
              bgcolor: 'white',
              boxShadow: 24,
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6">Assign to Roles</Typography>
              <IconButton
                onClick={() => setShowRoleAssignPanel(false)}
                size="small"
              >
                <X />
              </IconButton>
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Assign this dashboard to roles. Users with assigned roles will see this dashboard as a tab.
              </Typography>

              {loadingRoles ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Stack spacing={2}>
                  {/* Assigned Roles */}
                  {roleAssignments.length > 0 && (
                    <Box>
                      <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>Assigned Roles</Typography>
                      <Stack spacing={1}>
                        {roleAssignments.map((assignment) => (
                          <Paper
                            key={assignment.id}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              p: 1.5,
                              bgcolor: 'rgba(46, 125, 50, 0.08)',
                              border: 1,
                              borderColor: 'success.main',
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Users sx={{ fontSize: 16, color: 'success.main' }} />
                              <Typography variant="body2" fontWeight="medium">
                                {assignment.group_name || assignment.role_name || 'Unnamed Group'}
                              </Typography>
                              {assignment.is_default && (
                                <Chip label="Default" size="small" color="success" sx={{ height: 20 }} />
                              )}
                            </Box>
                            <IconButton
                              onClick={() => handleUnassignRole(assignment.id)}
                              disabled={assigningRole === assignment.id}
                              size="small"
                              color="error"
                            >
                              {assigningRole === assignment.id ? (
                                <CircularProgress size={16} />
                              ) : (
                                <X sx={{ fontSize: 16 }} />
                              )}
                            </IconButton>
                          </Paper>
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {/* Available Roles */}
                  <Box>
                    <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                      {roleAssignments.length > 0 ? 'Available Groups' : 'Select Groups to Assign'}
                    </Typography>
                    <Stack spacing={1}>
                      {roles
                        .filter((role) => !roleAssignments.some((a) => (a.group || a.role) === role.id))
                        .map((role) => (
                          <Paper
                            key={role.id}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              p: 1.5,
                              bgcolor: 'grey.50',
                              border: 1,
                              borderColor: 'grey.200',
                              transition: 'all 0.2s',
                              '&:hover': {
                                borderColor: 'primary.main',
                                bgcolor: 'rgba(25, 118, 210, 0.08)',
                              },
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Users sx={{ fontSize: 16, color: 'text.disabled' }} />
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {role.name}
                                </Typography>
                                {role.description && (
                                  <Typography variant="caption" color="text.secondary">{role.description}</Typography>
                                )}
                              </Box>
                            </Box>
                            <Button
                              onClick={() => handleAssignRole(role.id)}
                              disabled={assigningRole === role.id}
                              size="small"
                              variant="contained"
                              sx={{ minWidth: 60 }}
                            >
                              {assigningRole === role.id ? (
                                <CircularProgress size={12} color="inherit" />
                              ) : (
                                'Assign'
                              )}
                            </Button>
                          </Paper>
                        ))}

                      {roles.filter((role) => !roleAssignments.some((a) => (a.group || a.role) === role.id))
                        .length === 0 && (
                        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 2 }}>
                          All roles have been assigned to this dashboard.
                        </Typography>
                      )}
                    </Stack>
                  </Box>

                  {roles.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Users sx={{ fontSize: 32, color: 'grey.300', mx: 'auto', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">No roles available.</Typography>
                      <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                        Create roles in Settings to assign dashboards.
                      </Typography>
                    </Box>
                  )}
                </Stack>
              )}
            </Box>
          </Box>
        </>
      )}
    </Box>
  )
}

export default DashboardBuilderPage
