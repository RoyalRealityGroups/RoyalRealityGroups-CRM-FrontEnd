/**
 * Dashboard Renderer Component
 *
 * Renders a custom dashboard with its widgets.
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { HourglassEmpty as Loader2, Dashboard as LayoutDashboard, Refresh as RefreshCw } from '@mui/icons-material'
import { dashboardsApi } from '../../api/dashboards.api';
import type { Dashboard } from '../../api/dashboards.api';
import WidgetRenderer from './WidgetRenderer'
import RGL, { Responsive, WidthProvider } from 'react-grid-layout'

const ResponsiveGridLayout = WidthProvider(Responsive)

interface DashboardRendererProps {
  dashboardId: string
  onTaskClick?: (taskId: string, projectId?: string) => void
}

const DashboardRenderer = ({ dashboardId, onTaskClick }: DashboardRendererProps) => {
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  const handleRefreshAll = () => {
    setRefreshing(true)
    setRefreshKey((prev) => prev + 1)
    // Reset refreshing state after a brief delay
    setTimeout(() => setRefreshing(false), 1000)
  }

  // Handle widget navigation events
  const handleWidgetNavigate = useCallback((event: CustomEvent) => {
    const { type, id, projectId } = event.detail

    if (type === 'task' && id) {
      if (onTaskClick) {
        onTaskClick(id, projectId)
      } else if (projectId) {
        navigate(`/projects/${projectId}/tasks?taskId=${id}`)
      }
    } else if (type === 'todo' && id) {
      navigate(`/todos?todoId=${id}`)
    } else if (type === 'project' && id) {
      navigate(`/projects/${id}`)
    }
  }, [navigate, onTaskClick])

  useEffect(() => {
    // Listen for widget navigation events
    window.addEventListener('widget-navigate', handleWidgetNavigate as EventListener)
    return () => {
      window.removeEventListener('widget-navigate', handleWidgetNavigate as EventListener)
    }
  }, [handleWidgetNavigate])

  useEffect(() => {
    loadDashboard()
  }, [dashboardId])

  const loadDashboard = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('[DashboardRenderer] Loading dashboard:', dashboardId)
      const response = await dashboardsApi.get(dashboardId)
      console.log('[DashboardRenderer] Response:', response)
      if (response.success && response.data) {
        console.log('[DashboardRenderer] Dashboard loaded:', response.data.name, 'Widgets:', response.data.widgets?.length || 0)
        setDashboard(response.data)
      } else {
        console.error('[DashboardRenderer] API returned success=false')
        setError('Failed to load dashboard')
      }
    } catch (err) {
      console.error('[DashboardRenderer] Error loading dashboard:', err)
      setError('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error || !dashboard) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <LayoutDashboard className="w-12 h-12 mb-4" />
        <p>{error || 'Dashboard not found'}</p>
      </div>
    )
  }

  const widgets = dashboard.widgets || []
  const visibleWidgets = widgets.filter((w) => w.is_visible)

  if (widgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <LayoutDashboard className="w-12 h-12 mb-4" />
        <p className="text-lg font-medium">No widgets configured</p>
        <p className="text-sm mt-1">This dashboard doesn't have any widgets yet.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Dashboard Header with Refresh */}
      <div className="flex items-center justify-end mb-3">
        <button
          onClick={handleRefreshAll}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-blue-600 bg-white hover:bg-blue-50 border border-gray-200 rounded-lg transition-colors disabled:opacity-50"
          title="Refresh all widgets"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Widget Grid */}
        <ResponsiveGridLayout
          className="layout"
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
          cols={{ lg: 12, md: 12, sm: 6, xs: 4 }}
          rowHeight={120}
          layouts={{
            lg: visibleWidgets.map((w) => ({
              i: w.id,
              x: w.position_x || 0,
              y: w.position_y || 0,
              w: w.width || 3,
              h: w.height || 2,
            })),
          }}
          isDraggable={false}
          isResizable={false}
          compactType="vertical"
          margin={[16, 16]}
        >
          {visibleWidgets.map((widget) => (
            <div
              key={widget.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
            >
              <WidgetRenderer widget={widget} refreshKey={refreshKey} />
            </div>
          ))}
        </ResponsiveGridLayout>
    </div>
  )
}

export default DashboardRenderer
