import { useEffect, useState } from 'react'
import { Box, CircularProgress, Typography, Paper } from '@mui/material'
import { Responsive, WidthProvider } from 'react-grid-layout'
import { dashboardsApi, dashboardWidgetsApi, type Dashboard, type DashboardWidget } from '../../api/dashboards.api'
import WidgetRenderer from '../dashboards/WidgetRenderer'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const ResponsiveGridLayout = WidthProvider(Responsive)

interface DashboardViewerProps {
  dashboardId: string
}

const DashboardViewer = ({ dashboardId }: DashboardViewerProps) => {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [widgets, setWidgets] = useState<DashboardWidget[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true)
        console.log('Loading dashboard:', dashboardId)
        const [dashboardResponse, widgetsResponse] = await Promise.all([
          dashboardsApi.get(dashboardId),
          dashboardWidgetsApi.list(dashboardId)
        ])
        console.log('Dashboard response:', dashboardResponse)
        console.log('Widgets response:', widgetsResponse)
        setDashboard(dashboardResponse.data)
        setWidgets(widgetsResponse.data)
      } catch (error) {
        console.error('Failed to load dashboard:', error)
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [dashboardId])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!dashboard) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Typography variant="h6" color="error">Dashboard not found</Typography>
      </Box>
    )
  }

  if (widgets.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">No widgets in this dashboard</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This dashboard doesn't have any widgets yet.
          </Typography>
        </Box>
      </Box>
    )
  }

  const layouts = widgets.map(widget => ({
    i: widget.id,
    x: widget.position_x,
    y: widget.position_y,
    w: widget.width,
    h: widget.height,
    static: true
  }))

  return (
    <Box>
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layouts }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 24, md: 20, sm: 12, xs: 8, xxs: 4 }}
        rowHeight={50}
        isDraggable={false}
        isResizable={false}
        margin={[16, 16]}
      >
        {widgets.map(widget => (
          <Paper
            key={widget.id}
            elevation={1}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: 1,
              borderColor: 'divider',
              opacity: widget.is_visible ? 1 : 0.5,
            }}
          >
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              <WidgetRenderer widget={widget} isPreview={true} />
            </Box>
          </Paper>
        ))}
      </ResponsiveGridLayout>
    </Box>
  )
}

export default DashboardViewer
