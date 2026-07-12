import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Chip,
  Grid,
} from '@mui/material'
import {
  Add as Plus,
  Dashboard as LayoutDashboard,
  Edit as Edit2,
  Delete as Trash2,
  ContentCopy as Copy,
  People as Users,
  Public as Globe,
  Lock,
  MoreVert as MoreVertical,
  Search,
} from '@mui/icons-material'
import toast from 'react-hot-toast'
import { dashboardsApi } from '../../api/dashboards.api'
import type { DashboardListItem } from '../../api/dashboards.api'

const DashboardListPage = () => {
  const navigate = useNavigate()
  const [dashboards, setDashboards] = useState<DashboardListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedDashboard, setSelectedDashboard] = useState<DashboardListItem | null>(null)
  const [anchorEl, setAnchorEl] = useState<{ [key: string]: HTMLElement | null }>({})

  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    icon: 'LayoutDashboard',
    visibility: 'role' as 'private' | 'role' | 'organization',
  })
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadDashboards()
  }, [])

  const loadDashboards = async () => {
    setLoading(true)
    try {
      const response = await dashboardsApi.list()
      if (response.success && response.data) {
        setDashboards(response.data)
      }
    } catch (error) {
      console.error('Error loading dashboards:', error)
      toast.error('Failed to load dashboards')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!createForm.name.trim()) {
      toast.error('Dashboard name is required')
      return
    }

    setCreating(true)
    try {
      const response = await dashboardsApi.create({
        name: createForm.name,
        description: createForm.description,
        icon: createForm.icon,
        visibility: createForm.visibility,
      })
      if (response.success && response.data) {
        toast.success('Dashboard created successfully')
        setShowCreateModal(false)
        setCreateForm({ name: '', description: '', icon: 'LayoutDashboard', visibility: 'role' })
        const dashboardId = response.data.id || '0'
        navigate(`/dashboard-builder/${dashboardId}`)
      }
    } catch (error) {
      console.error('Error creating dashboard:', error)
      toast.error('Failed to create dashboard')
    } finally {
      setCreating(false)
    }
  }

  const handleDuplicate = async (dashboard: DashboardListItem) => {
    try {
      const response = await dashboardsApi.duplicate(dashboard.id)
      if (response.success) {
        toast.success('Dashboard duplicated successfully')
        loadDashboards()
      }
    } catch (error) {
      console.error('Error duplicating dashboard:', error)
      toast.error('Failed to duplicate dashboard')
    }
    handleCloseMenu(dashboard.id)
  }

  const handleDelete = async () => {
    if (!selectedDashboard) return

    setDeleting(true)
    try {
      const response = await dashboardsApi.delete(selectedDashboard.id)
      if (response.success) {
        toast.success('Dashboard deleted successfully')
        setShowDeleteModal(false)
        setSelectedDashboard(null)
        loadDashboards()
      }
    } catch (error) {
      console.error('Error deleting dashboard:', error)
      toast.error('Failed to delete dashboard')
    } finally {
      setDeleting(false)
    }
  }

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, dashboardId: string) => {
    setAnchorEl({ ...anchorEl, [dashboardId]: event.currentTarget })
  }

  const handleCloseMenu = (dashboardId: string) => {
    setAnchorEl({ ...anchorEl, [dashboardId]: null })
  }

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'private':
        return <Lock sx={{ fontSize: 16, color: 'text.secondary' }} />
      case 'role':
        return <Users sx={{ fontSize: 16, color: 'primary.main' }} />
      case 'organization':
        return <Globe sx={{ fontSize: 16, color: 'success.main' }} />
      default:
        return null
    }
  }

  const getVisibilityLabel = (visibility: string) => {
    switch (visibility) {
      case 'private':
        return 'Private'
      case 'role':
        return 'Role-Based'
      case 'organization':
        return 'Organization'
      default:
        return visibility
    }
  }

  const filteredDashboards = dashboards.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ bgcolor: 'white', borderBottom: 1, borderColor: 'divider', px: 3, py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h5" fontWeight={600}>
              Dashboard Builder
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Create and manage custom dashboards with widgets
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Plus />}
            onClick={() => setShowCreateModal(true)}
            sx={{ textTransform: 'none' }}
          >
            New Dashboard
          </Button>
        </Box>

        {/* Search */}
        <Box sx={{ mt: 2, maxWidth: 400 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search dashboards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: 20, color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
            <CircularProgress />
          </Box>
        ) : filteredDashboards.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 12 }}>
            <LayoutDashboard sx={{ fontSize: 48, color: 'grey.300', mb: 2 }} />
            <Typography variant="h6" fontWeight={500} gutterBottom>
              No dashboards found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {searchQuery ? 'Try a different search term' : 'Create your first dashboard to get started'}
            </Typography>
            {!searchQuery && (
              <Button variant="contained" startIcon={<Plus />} onClick={() => setShowCreateModal(true)}>
                Create Dashboard
              </Button>
            )}
          </Box>
        ) : (
          <Grid container spacing={2}>
            {filteredDashboards.map((dashboard) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={dashboard.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'box-shadow 0.2s',
                    '&:hover': {
                      boxShadow: 3,
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, cursor: 'pointer' }}
                        onClick={() => navigate(`/dashboard-builder/${dashboard.id}`)}
                      >
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: 'primary.lighter',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <LayoutDashboard sx={{ fontSize: 20, color: 'primary.main' }} />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="subtitle2" fontWeight={500} sx={{ wordWrap: 'break-word' }}>
                            {dashboard.name}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                            {getVisibilityIcon(dashboard.visibility)}
                            <Typography variant="caption" color="text.secondary">
                              {getVisibilityLabel(dashboard.visibility)}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>

                      <IconButton
                        size="small"
                        onClick={(e) => handleOpenMenu(e, dashboard.id)}
                        sx={{ ml: 1 }}
                      >
                        <MoreVertical sx={{ fontSize: 16 }} />
                      </IconButton>

                      <Menu
                        anchorEl={anchorEl[dashboard.id]}
                        open={Boolean(anchorEl[dashboard.id])}
                        onClose={() => handleCloseMenu(dashboard.id)}
                      >
                        <MenuItem
                          onClick={() => {
                            navigate(`/dashboard-builder/${dashboard.id}`)
                            handleCloseMenu(dashboard.id)
                          }}
                        >
                          <Edit2 sx={{ fontSize: 16, mr: 1 }} />
                          Edit Dashboard
                        </MenuItem>
                        <MenuItem onClick={() => handleDuplicate(dashboard)}>
                          <Copy sx={{ fontSize: 16, mr: 1 }} />
                          Duplicate
                        </MenuItem>
                        {!dashboard.is_system && (
                          <MenuItem
                            onClick={() => {
                              setSelectedDashboard(dashboard)
                              setShowDeleteModal(true)
                              handleCloseMenu(dashboard.id)
                            }}
                            sx={{ color: 'error.main' }}
                          >
                            <Trash2 sx={{ fontSize: 16, mr: 1 }} />
                            Delete
                          </MenuItem>
                        )}
                      </Menu>
                    </Box>

                    {dashboard.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 2,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {dashboard.description}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary">
                        {dashboard.widget_count} widgets
                      </Typography>
                      {dashboard.is_default && (
                        <Chip label="Default" size="small" color="success" sx={{ height: 20 }} />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Create Modal */}
      <Dialog open={showCreateModal} onClose={() => setShowCreateModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Dashboard</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Name"
              fullWidth
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              placeholder="My Dashboard"
            />

            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              placeholder="Dashboard description..."
            />

            <FormControl fullWidth>
              <InputLabel>Visibility</InputLabel>
              <Select
                value={createForm.visibility}
                label="Visibility"
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    visibility: e.target.value as 'private' | 'role' | 'organization',
                  })
                }
              >
                <MenuItem value="private">Private - Only you can see</MenuItem>
                <MenuItem value="role">Role-Based - Assign to roles</MenuItem>
                <MenuItem value="organization">Organization - Everyone can see</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateModal(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={creating}
            startIcon={creating ? <CircularProgress size={16} /> : null}
          >
            Create Dashboard
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onClose={() => setShowDeleteModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Dashboard</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete "{selectedDashboard?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : null}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default DashboardListPage
