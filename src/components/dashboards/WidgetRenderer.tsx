/**
 * Widget Renderer Component
 *
 * Renders a widget based on its type with data fetching.
 * Features comprehensive styling with color themes and modern design.
 */
import { useState, useEffect } from 'react'
import {
  HourglassEmpty as Loader2,
  TrendingUp,
  TrendingDown,
  BarChart as BarChart3,
  Speed as Activity,
  CheckBox as CheckSquare,
  Folder,
  Warning as AlertTriangle,
  Circle,
  Schedule as Clock,
  Bolt as Zap,
  ArrowForward as ArrowRight,
  AutoAwesome as Sparkles,
  Info,
  CheckCircle as CheckCircle2,
  Cancel as XCircle,
  Error as AlertCircle,
  CalendarToday as Calendar,
  People as Users,
  TrackChanges as Target,
  PushPin as Pin,
  Star,
  FormatListBulleted as ListTodo,
  Pause,
  PauseCircle,
  Block as Ban,
  Refresh as RefreshCw,
} from '@mui/icons-material'
import { widgetDataApi,  } from '../../api/dashboards.api';
import type{ DashboardWidget,WidgetFilters } from '../../api/dashboards.api';
import { useScreenSettings } from '../../contexts/ScreenSettingsContext'
import { Box, useMediaQuery, useTheme as useMuiTheme, Typography, IconButton } from '@mui/material';
import MyRankWidget from './widgets/MyRankWidget'
import StreakWidget from './widgets/StreakWidget'
import RecentBadgesWidget from './widgets/RecentBadgesWidget'
import InteractiveTodoWidget from './widgets/InteractiveTodoWidget'

const GAMIFICATION_WIDGET_TYPES = ['my_rank', 'streak_counter', 'recent_badges']

// Color themes for widgets - MUI compatible
const getColorThemes = (muiTheme: any) => ({
  blue: {
    primary: muiTheme.palette.primary.main,
    bg: muiTheme.palette.primary.light,
    bgLight: muiTheme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.08)' : '#e3f2fd',
    border: muiTheme.palette.primary.light,
    iconBg: muiTheme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.15)' : '#bbdefb',
  },
  green: {
    primary: muiTheme.palette.success.main,
    bg: muiTheme.palette.success.light,
    bgLight: muiTheme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.08)' : '#e8f5e9',
    border: muiTheme.palette.success.light,
    iconBg: muiTheme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.15)' : '#a5d6a7',
  },
  purple: {
    primary: muiTheme.palette.secondary.main,
    bg: muiTheme.palette.secondary.light,
    bgLight: muiTheme.palette.mode === 'dark' ? 'rgba(156, 39, 176, 0.08)' : '#f3e5f5',
    border: muiTheme.palette.secondary.light,
    iconBg: muiTheme.palette.mode === 'dark' ? 'rgba(156, 39, 176, 0.15)' : '#ce93d8',
  },
  orange: {
    primary: muiTheme.palette.warning.main,
    bg: muiTheme.palette.warning.light,
    bgLight: muiTheme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.08)' : '#fff3e0',
    border: muiTheme.palette.warning.light,
    iconBg: muiTheme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.15)' : '#ffcc80',
  },
  pink: {
    primary: muiTheme.palette.error.main,
    bg: muiTheme.palette.error.light,
    bgLight: muiTheme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.08)' : '#ffebee',
    border: muiTheme.palette.error.light,
    iconBg: muiTheme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.15)' : '#ef9a9a',
  },
  cyan: {
    primary: muiTheme.palette.info.main,
    bg: muiTheme.palette.info.light,
    bgLight: muiTheme.palette.mode === 'dark' ? 'rgba(0, 188, 212, 0.08)' : '#e0f7fa',
    border: muiTheme.palette.info.light,
    iconBg: muiTheme.palette.mode === 'dark' ? 'rgba(0, 188, 212, 0.15)' : '#80deea',
  },
  indigo: {
    primary: muiTheme.palette.primary.dark,
    bg: muiTheme.palette.primary.light,
    bgLight: muiTheme.palette.mode === 'dark' ? 'rgba(63, 81, 181, 0.08)' : '#e8eaf6',
    border: muiTheme.palette.primary.light,
    iconBg: muiTheme.palette.mode === 'dark' ? 'rgba(63, 81, 181, 0.15)' : '#9fa8da',
  },
  gray: {
    primary: muiTheme.palette.grey[600],
    bg: muiTheme.palette.grey[300],
    bgLight: muiTheme.palette.mode === 'dark' ? 'rgba(158, 158, 158, 0.08)' : '#fafafa',
    border: muiTheme.palette.grey[300],
    iconBg: muiTheme.palette.mode === 'dark' ? 'rgba(158, 158, 158, 0.15)' : '#e0e0e0',
  },
})

type ColorTheme = 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'cyan' | 'indigo' | 'gray'

// Get theme from widget config or default
const getWidgetTheme = (widget: DashboardWidget): ColorTheme => {
  const config = widget.config || {}
  return (config.colorTheme as ColorTheme) || 'blue'
}

interface WidgetRendererProps {
  widget: DashboardWidget
  isPreview?: boolean // When true, show example data instead of fetching from API
  refreshKey?: number // Incremented externally to trigger re-fetch
  height?: number | string // Accept decimal values for height (e.g., 1.5, '200px', '50%')
  width?: number | string // Accept decimal values for width (e.g., 2.5, '300px', '100%')
}

// Mock data generators for preview mode
const generateMockData = (widgetTypeCode: string, dataSource?: string): any => {
  switch (widgetTypeCode) {
    case 'stats_card':
    case 'stats_counter':
      return {
        value: 42,
        label: dataSource?.split('.')[0] === 'tasks' ? 'Total Tasks'
             : dataSource?.split('.')[0] === 'projects' ? 'Active Projects'
             : dataSource?.split('.')[0] === 'todos' ? 'My Todos'
             : 'Total Count',
        trend: 12,
        progress: 68,
      }

    case 'bar_chart':
      return {
        data: [
          { name: 'Pending', value: 18 },
          { name: 'Confirmed', value: 32 },
          { name: 'Dispatched', value: 25 },
          { name: 'Delivered', value: 48 },
          { name: 'Cancelled', value: 5 },
        ],
        total: 128,
      }

    case 'pie_chart':
    case 'donut_chart':
      return {
        data: [
          { name: 'Retailer', value: 45 },
          { name: 'Distributor', value: 32 },
          { name: 'Superstockist', value: 28 },
          { name: 'Direct', value: 15 },
        ],
      }

    case 'line_chart':
    case 'area_chart':
      return {
        data: [
          { name: 'Jan', value: 45 },
          { name: 'Feb', value: 52 },
          { name: 'Mar', value: 48 },
          { name: 'Apr', value: 61 },
          { name: 'May', value: 55 },
          { name: 'Jun', value: 67 },
          { name: 'Jul', value: 73 },
        ],
      }

    case 'activity_feed':
      return {
        items: [
          { id: '1', user: 'John Doe', action: 'completed', target: 'Setup user authentication', time: '2 hours ago', action_type: 'completed' },
          { id: '2', user: 'Jane Smith', action: 'created', target: 'API integration task', time: '4 hours ago', action_type: 'created' },
          { id: '3', user: 'Mike Johnson', action: 'updated', target: 'Dashboard layout', time: 'Yesterday', action_type: 'updated' },
        ],
      }

    case 'task_list':
      return {
        items: [
          { id: '1', code: 'TSK-001', title: 'Implement login page', status: 'in_progress', priority: 'high' },
          { id: '2', code: 'TSK-002', title: 'Design dashboard layout', status: 'todo', priority: 'medium' },
          { id: '3', code: 'TSK-003', title: 'Fix navigation bug', status: 'done', priority: 'critical' },
          { id: '4', code: 'TSK-004', title: 'Add user profile', status: 'in_review', priority: 'low' },
        ],
        type: 'tasks',
      }

    case 'data_table':
    case 'simple_table':
      if (dataSource?.startsWith('tasks.')) {
        return {
          items: [
            { id: '1', code: 'TSK-101', title: 'Create API endpoints', status: 'in_progress', priority: 'high', assigned_to: 'John Doe' },
            { id: '2', code: 'TSK-102', title: 'Write unit tests', status: 'todo', priority: 'medium', assigned_to: 'Jane Smith' },
            { id: '3', code: 'TSK-103', title: 'Update documentation', status: 'done', priority: 'low', assigned_to: 'Mike Johnson' },
          ],
          type: 'tasks',
        }
      } else if (dataSource?.startsWith('todos.')) {
        return {
          items: [
            { id: '1', title: 'Review pull request', status: 'pending', priority: 'high', due_date: '2025-01-28' },
            { id: '2', title: 'Update meeting notes', status: 'in_progress', priority: 'medium', due_date: '2025-01-27' },
            { id: '3', title: 'Schedule team call', status: 'completed', priority: 'low', due_date: '2025-01-26' },
          ],
          type: 'todos',
        }
      }
      return {
        items: [
          { id: '1', name: 'Item A', status: 'active', value: 100 },
          { id: '2', name: 'Item B', status: 'pending', value: 75 },
          { id: '3', name: 'Item C', status: 'completed', value: 50 },
        ],
      }

    case 'todo_list':
    case 'todo_interactive':
      return {
        items: [
          { id: '1', title: 'Review code changes', status: 'pending', priority: 'high', due_date: '2025-01-28', is_pinned: true },
          { id: '2', title: 'Prepare presentation', status: 'in_progress', priority: 'medium', due_date: '2025-01-29', is_starred: true },
          { id: '3', title: 'Update documentation', status: 'completed', priority: 'low', due_date: '2025-01-26' },
        ],
        type: 'todos',
      }

    case 'project_list':
      return {
        items: [
          { id: '1', name: 'Website Redesign', code: 'PRJ-001', status: 'active', progress: 75 },
          { id: '2', name: 'Mobile App', code: 'PRJ-002', status: 'active', progress: 45 },
          { id: '3', name: 'API Integration', code: 'PRJ-003', status: 'on_hold', progress: 30 },
        ],
      }

    case 'alerts_list':
      return {
        items: [
          { id: '1', message: '3 tasks are overdue', type: 'warning', time: '1 hour ago' },
          { id: '2', message: 'Sprint review scheduled for tomorrow', type: 'info', time: '2 hours ago' },
          { id: '3', message: 'Build completed successfully', type: 'success', time: '3 hours ago' },
        ],
      }

    case 'progress_ring':
      return {
        value: 72,
        max: 100,
        label: 'Sprint Progress',
      }

    case 'my_rank':
      return { user_rank: 3, total_users: 25, user_points: 150 }
    case 'streak_counter':
      return { current_streak_days: 7, longest_streak_days: 14 }
    case 'recent_badges':
      return { results: [{ id: '1', badge: { icon: '\ud83c\udfc6', name: 'First Task' }, created_at: new Date().toISOString() }] }

    case 'calendar_preview': {
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dayAfter = new Date(today)
      dayAfter.setDate(dayAfter.getDate() + 2)
      return {
        events: [
          { id: '1', title: 'Sprint Review Meeting', date: today.toISOString().split('T')[0], time: '10:00', type: 'action', project_code: 'PRJ-1' },
          { id: '2', title: 'Fix login page bug', date: today.toISOString().split('T')[0], type: 'task', priority: 'high', project_code: 'PRJ-1' },
          { id: '3', title: 'Design review', date: tomorrow.toISOString().split('T')[0], time: '14:00', type: 'action', project_code: 'PRJ-2' },
          { id: '4', title: 'API integration', date: tomorrow.toISOString().split('T')[0], type: 'task', priority: 'medium', project_code: 'PRJ-1' },
          { id: '5', title: 'Deploy to staging', date: dayAfter.toISOString().split('T')[0], type: 'task', priority: 'critical', project_code: 'PRJ-2' },
        ],
        total: 5,
      }
    }

    default:
      return {
        value: 0,
        label: 'Preview',
      }
  }
}

// Fetch widget data from API with optional filters
const fetchWidgetData = async (dataSource: string, filters?: WidgetFilters): Promise<any> => {
  try {
    console.log('[WidgetRenderer] Fetching data for:', dataSource, 'with filters:', filters)
    const response = await widgetDataApi.fetch(dataSource, filters)
    console.log('[WidgetRenderer] Response:', response)
    if (response.success) {
      return response.data
    }
    console.warn('[WidgetRenderer] API returned success=false')
    return { value: 0, label: 'No data' }
  } catch (error) {
    console.error('[WidgetRenderer] Error fetching widget data:', error)
    return { value: 0, label: 'Error loading data' }
  }
}

// Convert widget.filters to WidgetFilters type
const parseWidgetFilters = (filters: Record<string, any> | null | undefined): WidgetFilters | undefined => {
  if (!filters || Object.keys(filters).length === 0) {
    return undefined
  }

  const parsedFilters: WidgetFilters = {}

  if (filters.project_id) {
    parsedFilters.project_id = filters.project_id
  }
  if (filters.date_range) {
    parsedFilters.date_range = filters.date_range
  }
  if (filters.start_date) {
    parsedFilters.start_date = filters.start_date
  }
  if (filters.end_date) {
    parsedFilters.end_date = filters.end_date
  }
  if (filters.status) {
    parsedFilters.status = Array.isArray(filters.status) ? filters.status : [filters.status]
  }
  if (filters.priority) {
    parsedFilters.priority = Array.isArray(filters.priority) ? filters.priority : [filters.priority]
  }
  if (filters.limit) {
    parsedFilters.limit = Number(filters.limit)
  }
  if (filters.assigned_to_me) {
    parsedFilters.assigned_to_me = filters.assigned_to_me === true || filters.assigned_to_me === 'true'
  }

  return Object.keys(parsedFilters).length > 0 ? parsedFilters : undefined
}

const WidgetRenderer = ({ widget, isPreview = false, refreshKey = 0, height, width }: WidgetRendererProps) => {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(!isPreview) // Don't show loading in preview mode
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const { gamificationEnabled } = useScreenSettings()
  // const { resolvedTheme } = useTheme()

  // Skip rendering gamification widgets when module is disabled
  if (GAMIFICATION_WIDGET_TYPES.includes(widget.widget_type_code) && !gamificationEnabled && !isPreview) {
    return null
  }

  useEffect(() => {
    if (isPreview) {
      // In preview mode, use mock data
      const mockData = generateMockData(widget.widget_type_code, widget.data_source)
      setData(mockData)
      setLoading(false)
    } else {
      loadData()
    }
    // Re-fetch when data_source, filters, or refreshKey change
  }, [widget.data_source, JSON.stringify(widget.filters), isPreview, widget.widget_type_code, refreshKey])

  // Manual refresh handler for per-widget refresh button
  const handleRefresh = async () => {
    if (isPreview || refreshing) return
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const loadData = async () => {
    if (isPreview) return // Skip API calls in preview mode

    console.log('[WidgetRenderer] Widget:', widget.title, 'data_source:', widget.data_source, 'type:', widget.widget_type_code, 'filters:', widget.filters)

    if (!widget.data_source) {
      console.log('[WidgetRenderer] No data_source configured for widget:', widget.title)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      // Parse widget filters and fetch data
      const filters = parseWidgetFilters(widget.filters)
      const result = await fetchWidgetData(widget.data_source, filters)
      console.log('[WidgetRenderer] Data received for', widget.title, ':', result)
      if (result.label === 'Error loading data') {
        setError('Failed to load data')
      }
      setData(result)
    } catch (error) {
      console.error('[WidgetRenderer] Error loading widget data:', error)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  // Render based on widget type
  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <Loader2 sx={{ fontSize: 24, animation: 'spin 1s linear infinite', color: 'text.disabled' }} />
        </Box>
      )
    }

    // Show error state (skip in preview mode)
    if (error && !isPreview) {
      return (
        <Box sx={{ p: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" color="error" textAlign="center">{error}</Typography>
        </Box>
      )
    }

    // Show message if no data source configured (except for widgets that don't need data or in preview mode)
    const noDataSourceWidgets = ['welcome_card', 'quick_actions', 'rich_text']
    if (!widget.data_source && !noDataSourceWidgets.includes(widget.widget_type_code) && !isPreview) {
      return (
        <Box sx={{ p: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" color="text.disabled" textAlign="center">No data source configured</Typography>
        </Box>
      )
    }

    switch (widget.widget_type_code) {
      case 'stats_card':
        return <StatsCardContent widget={widget} data={data} />
      case 'stats_counter':
        return <StatsCounterContent widget={widget} data={data} />
      case 'bar_chart':
        return <BarChartContent widget={widget} data={data} />
      case 'activity_feed':
        return <ActivityFeedContent widget={widget} data={data} />
      case 'task_list':
        return <TaskListContent widget={widget} data={data} isPreview={isPreview} />
      case 'todo_list':
        return <TodoListContent widget={widget} data={data} isPreview={isPreview} />
      case 'todo_interactive':
        return <InteractiveTodoWidget widget={widget} />
      case 'project_list':
        return <ProjectListContent widget={widget} data={data} isPreview={isPreview} />
      case 'alerts_list':
        return <AlertsListContent widget={widget} data={data} />
      case 'welcome_card':
        return <WelcomeCardContent widget={widget} />
      case 'quick_actions':
        return <QuickActionsContent widget={widget} />
      case 'pie_chart':
      case 'donut_chart':
        return <PieChartContent widget={widget} data={data} />
      case 'line_chart':
      case 'area_chart':
        return <LineChartContent widget={widget} data={data} />
      case 'data_table':
      case 'simple_table':
        return <DataTableContent widget={widget} data={data} isPreview={isPreview} />
      case 'progress_ring':
        return <ProgressRingContent widget={widget} data={data} />
      case 'my_rank':
        return <MyRankWidget widget={widget} />
      case 'streak_counter':
        return <StreakWidget widget={widget} />
      case 'recent_badges':
        return <RecentBadgesWidget widget={widget} />
      case 'calendar_preview':
        return <CalendarPreviewContent widget={widget} data={data} />
      default:
        return <PlaceholderContent widget={widget} />
    }
  }

  const muiTheme = useMuiTheme()
  const theme = getColorThemes(muiTheme)[getWidgetTheme(widget)]
  const config = widget.config || {}
  // Auto-hide header for stats counter only (stats_card now shows title like other widgets)
  // In preview mode (builder), always hide internal header since the builder shows its own
  const selfLabeledWidgets = ['stats_counter']
  const showHeader = !isPreview && config.showHeader !== false && !selfLabeledWidgets.includes(widget.widget_type_code)
  const headerStyle = config.headerStyle || 'default' // 'default', 'colored', 'minimal'

  // Header style variations
  const headerStyles = {
    default: 'px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800',
    colored: `px-4 py-3 border-b ${theme.border} ${theme.bg}`,
    minimal: 'px-4 py-2 bg-transparent',
  }

  // Format height and width to handle decimal numbers properly
  const formattedHeight = height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : '100%'
  const formattedWidth = width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : '100%'

  return (
    <Box sx={{ height: formattedHeight, width: formattedWidth, display: 'flex', flexDirection: 'column', bgcolor: 'background.paper', position: 'relative' }}>
      {/* Preview Badge */}
      {isPreview && (
        <Box sx={{ position: 'absolute', top: 4, right: 4, zIndex: 10 }}>
          <Box component="span" sx={{ px: 1.5, py: 0.5, fontSize: 10, fontWeight: 500, bgcolor: 'warning.light', color: 'warning.dark', borderRadius: 0.5, border: 1, borderColor: 'warning.main' }}>
            Preview
          </Box>
        </Box>
      )}

      {/* Widget Header */}
      {showHeader && (
        <Box sx={{ flexShrink: 0, px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider', bgcolor: headerStyle === 'colored' ? theme.bg : 'background.paper' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} noWrap sx={{ color: headerStyle === 'colored' ? theme.primary : 'text.primary' }}>
                {widget.title}
              </Typography>
              {widget.subtitle && (
                <Typography variant="caption" color="text.secondary" noWrap sx={{ mt: 0.5 }}>{widget.subtitle}</Typography>
              )}
            </Box>
            {/* Manual refresh button (configurable per widget) */}
            {config.showRefresh && !isPreview && (
              <IconButton
                onClick={(e) => {
                  e.stopPropagation()
                  handleRefresh()
                }}
                disabled={refreshing}
                size="small"
                sx={{ ml: 1 }}
                title="Refresh widget data"
              >
                <RefreshCw sx={{ fontSize: 14, animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              </IconButton>
            )}
            {/* Optional auto-refresh indicator */}
            {config.refreshInterval && !isPreview && (
              <Box sx={{ flexShrink: 0, ml: 0.5 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} title="Auto-refreshing" />
              </Box>
            )}
          </Box>
        </Box>
      )}

      {/* Floating refresh button for widgets without header (stats_card, stats_counter) */}
      {!showHeader && config.showRefresh && !isPreview && (
        <IconButton
          onClick={(e) => {
            e.stopPropagation()
            handleRefresh()
          }}
          disabled={refreshing}
          size="small"
          sx={{ position: 'absolute', top: 6, right: 6, zIndex: 10 }}
          title="Refresh widget data"
        >
          <RefreshCw sx={{ fontSize: 14, animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
        </IconButton>
      )}

      {/* Widget Content */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>{renderContent()}</Box>
    </Box>
  )
}

// Stats Card Widget - Compact horizontal card with icon, value, and trend
const StatsCardContent = ({ widget, data }: { widget: DashboardWidget; data: any }) => {
  const config = widget.config || {}
  const trend = data?.trend || 0
  const muiTheme = useMuiTheme()
  const theme = getColorThemes(muiTheme)[getWidgetTheme(widget)]
  const isDark = muiTheme.palette.mode === 'dark'

  // Choose icon based on config or data source prefix
  const getIcon = () => {
    const iconName = config.icon || widget.data_source?.split('.')[0]
    switch (iconName) {
      case 'projects': return <Folder className="w-5 h-5" />
      case 'tasks': return <CheckSquare className="w-5 h-5" />
      case 'users': return <Users className="w-5 h-5" />
      case 'activity': return <Activity className="w-5 h-5" />
      case 'requirements': return <Target className="w-5 h-5" />
      case 'todos': return <ListTodo className="w-5 h-5" />
      default: return <BarChart3 className="w-5 h-5" />
    }
  }

  return (
    <Box
      sx={{
        px: { xs: 2, sm: 2.5 },
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        bgcolor: isDark ? 'transparent' : theme.bgLight,
      }}
    >
      {/* Icon Badge */}
      <Box
        sx={{
          flexShrink: 0,
          width: { xs: 36, sm: 44 },
          height: { xs: 36, sm: 44 },
          borderRadius: 1.5,
          bgcolor: theme.iconBg,
          color: theme.primary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {getIcon()}
      </Box>

      {/* Value & Label */}
      <Box sx={{ ml: { xs: 1.5, sm: 2 }, flex: 1, minWidth: 0, position: 'relative', zIndex: 10 }}>
        <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' }, lineHeight: 1.2 }}>
          {config.prefix || ''}{data?.value ?? 0}{config.suffix || ''}
        </Typography>
        <Typography variant="caption" color="text.secondary" fontWeight={500} noWrap sx={{ mt: 0.25, fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}>
          {data?.label || widget.title || 'Value'}
        </Typography>
      </Box>

      {/* Trend Indicator */}
      {config.showTrend !== false && trend !== 0 && (
        <Box
          sx={{
            flexShrink: 0,
            ml: { xs: 1, sm: 1.5 },
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            px: { xs: 0.75, sm: 1 },
            py: { xs: 0.25, sm: 0.5 },
            borderRadius: 10,
            fontSize: { xs: '0.625rem', sm: '0.75rem' },
            fontWeight: 600,
            bgcolor: trend > 0 ? 'success.lighter' : 'error.lighter',
            color: trend > 0 ? 'success.dark' : 'error.dark',
          }}
        >
          {trend > 0 ? <TrendingUp sx={{ fontSize: 12 }} /> : <TrendingDown sx={{ fontSize: 12 }} />}
          <span>{Math.abs(trend)}%</span>
        </Box>
      )}
    </Box>
  )
}

// Stats Counter Widget - Large centered counter with ring decoration
const StatsCounterContent = ({ widget, data }: { widget: DashboardWidget; data: any }) => {
  const config = widget.config || {}
  const muiTheme = useMuiTheme()
  const theme = getColorThemes(muiTheme)[getWidgetTheme(widget)]
  const isDark = muiTheme.palette.mode === 'dark'

  return (
    <Box
      sx={{
        p: { xs: 1.5, sm: 2 },
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        bgcolor: isDark ? 'transparent' : theme.bgLight,
      }}
    >
      <Box sx={{ textAlign: 'center', position: 'relative' }}>
        {/* Decorative ring */}
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <Box
            sx={{
              width: { xs: 80, sm: 112 },
              height: { xs: 80, sm: 112 },
              borderRadius: '50%',
              border: 4,
              borderColor: theme.border,
              opacity: 0.3,
            }}
          />
        </Box>

        {/* Main counter */}
        <Box sx={{ position: 'relative', zIndex: 10 }}>
          <Typography variant="h3" fontWeight={700} sx={{ fontSize: { xs: '1.875rem', sm: '3rem' }, color: theme.primary }}>
            {config.prefix || ''}
            {data?.value || 0}
            {config.suffix || ''}
          </Typography>
          <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mt: { xs: 0.5, sm: 1 }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            {data?.label || 'Count'}
          </Typography>

          {/* Secondary stats if available */}
          {data?.secondary && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mt: { xs: 1, sm: 1.5 } }}>
              {data.secondary.map((item: any, index: number) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Circle sx={{ fontSize: 8, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    {item.label}: {item.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}

// Bar colors for charts
const barColors = [
  { bar: 'primary.main', bg: 'primary.light', text: 'primary.dark' },
  { bar: 'success.main', bg: 'success.light', text: 'success.dark' },
  { bar: 'secondary.main', bg: 'secondary.light', text: 'secondary.dark' },
  { bar: 'warning.main', bg: 'warning.light', text: 'warning.dark' },
  { bar: 'error.main', bg: 'error.light', text: 'error.dark' },
  { bar: 'info.main', bg: 'info.light', text: 'info.dark' },
]

// Bar Chart Widget - Horizontal bar chart with colorful bars
const BarChartContent = ({ widget, data }: { widget: DashboardWidget; data: any }) => {
  const config = widget.config || {}
  const chartData = data?.data || []
  const maxValue = Math.max(...chartData.map((d: any) => d.value), 1)
  const showValues = config.showValues !== false
  const muiTheme = useMuiTheme()

  if (chartData.length === 0) {
    return (
      <Box sx={{ p: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <BarChart3 sx={{ fontSize: 32, mx: 'auto', mb: 1, opacity: 0.5, color: 'text.disabled' }} />
          <Typography variant="body2" color="text.secondary">No chart data available</Typography>
        </Box>
      </Box>
    )
  }

  // Get theme colors from MUI theme based on selected colorTheme
  const getThemeColors = () => {
    const themeName = getWidgetTheme(widget)
    const colorMap: Record<string, { main: string; light: string; dark: string }> = {
      blue: { main: muiTheme.palette.primary.main, light: muiTheme.palette.primary.light, dark: muiTheme.palette.primary.dark },
      green: { main: muiTheme.palette.success.main, light: muiTheme.palette.success.light, dark: muiTheme.palette.success.dark },
      purple: { main: muiTheme.palette.secondary.main, light: muiTheme.palette.secondary.light, dark: muiTheme.palette.secondary.dark },
      orange: { main: muiTheme.palette.warning.main, light: muiTheme.palette.warning.light, dark: muiTheme.palette.warning.dark },
      pink: { main: muiTheme.palette.error.main, light: muiTheme.palette.error.light, dark: muiTheme.palette.error.dark },
      cyan: { main: muiTheme.palette.info.main, light: muiTheme.palette.info.light, dark: muiTheme.palette.info.dark },
      indigo: { main: muiTheme.palette.primary.main, light: muiTheme.palette.primary.light, dark: muiTheme.palette.primary.dark },
      gray: { main: muiTheme.palette.grey[600], light: muiTheme.palette.grey[300], dark: muiTheme.palette.grey[800] },
    }
    return colorMap[themeName] || colorMap.blue
  }

  const themeColors = getThemeColors()

  return (
    <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Chart Bars */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {chartData.slice(0, 6).map((item: any, index: number) => {
            const percentage = (item.value / maxValue) * 100

            return (
              <Box key={index} sx={{ '&:hover .bar': { opacity: 0.8 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: 0.5,
                        bgcolor: themeColors.main
                      }}
                    />
                    <Typography variant="caption" fontWeight={500} color="text.primary" noWrap sx={{ maxWidth: 120 }}>
                      {item.name}
                    </Typography>
                  </Box>
                  {showValues && (
                    <Typography variant="caption" fontWeight={600} sx={{ color: themeColors.dark }}>
                      {item.value}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ height: 10, bgcolor: themeColors.light, borderRadius: 2, overflow: 'hidden' }}>
                  <Box
                    className="bar"
                    sx={{
                      height: '100%',
                      bgcolor: themeColors.main,
                      borderRadius: 2,
                      transition: 'all 0.7s ease-out',
                      width: `${percentage}%`
                    }}
                  />
                </Box>
              </Box>
            )
          })}
        </Box>
      </Box>

      {/* Total if available */}
      {data?.total !== undefined && (
        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="caption" fontWeight={500} color="text.secondary">Total</Typography>
          <Typography variant="body2" fontWeight={700} color="text.primary">{data.total}</Typography>
        </Box>
      )}
    </Box>
  )
}

// Activity action icon mapping
const activityIcons: Record<string, any> = {
  created: { icon: Sparkles, color: 'text-green-500', bg: 'bg-green-100' },
  updated: { icon: Activity, color: 'text-blue-500', bg: 'bg-blue-100' },
  completed: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-100' },
  deleted: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100' },
  commented: { icon: Info, color: 'text-purple-500', bg: 'bg-purple-100' },
  assigned: { icon: Users, color: 'text-orange-500', bg: 'bg-orange-100' },
  default: { icon: Circle, color: 'text-gray-400', bg: 'bg-gray-100' },
}

// Activity Feed Widget - Timeline-style activity list
const ActivityFeedContent = ({ widget, data }: { widget: DashboardWidget; data: any }) => {
  const activities = data?.items || []
  const config = widget.config || {}
  const showTimeline = config.showTimeline !== false

  if (activities.length === 0) {
    return (
      <div className="p-4 h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No recent activity</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 overflow-y-auto max-h-full">
      <div className={showTimeline ? 'relative' : ''}>
        {/* Timeline line */}
        {showTimeline && (
          <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-100" />
        )}

        <div className="space-y-4">
          {activities.map((activity: any, index: number) => {
            const actionType = activity.action_type || 'default'
            const iconConfig = activityIcons[actionType] || activityIcons.default
            const IconComponent = iconConfig.icon

            return (
              <div
                key={activity.id || index}
                className="flex items-start gap-3 text-sm relative group"
              >
                {/* Icon */}
                <div
                  className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${iconConfig.bg} relative z-10 transition-transform group-hover:scale-110`}
                >
                  <IconComponent className={`w-3 h-3 ${iconConfig.color}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1 flex-wrap">
                    <span className="text-gray-900 font-semibold">{activity.user}</span>
                    <span className="text-gray-500">{activity.action}</span>
                  </div>
                  {activity.target && (
                    <p className="text-gray-700 mt-0.5 truncate font-medium">
                      {activity.target}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-400 text-xs">{activity.time}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Task status configuration with icons
const taskStatusConfig: Record<string, { bg: string; text: string; border: string; icon: any }> = {
  todo: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', icon: Circle },
  in_progress: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', icon: Zap },
  paused: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', icon: PauseCircle },
  in_review: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', icon: AlertCircle },
  done: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200', icon: CheckCircle2 },
  blocked: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', icon: XCircle },
}

// Task priority configuration
const taskPriorityConfig: Record<string, { color: string; dot: string }> = {
  critical: { color: 'text-red-600', dot: 'bg-red-500' },
  high: { color: 'text-orange-600', dot: 'bg-orange-500' },
  medium: { color: 'text-yellow-600', dot: 'bg-yellow-500' },
  low: { color: 'text-blue-600', dot: 'bg-blue-400' },
}

// Task List Widget - Modern task cards with status indicators
const TaskListContent = ({ widget, data, isPreview = false }: { widget: DashboardWidget; data: any; isPreview?: boolean }) => {
  const tasks = data?.items || []
  const config = widget.config || {}
  const showPriority = config.showPriority !== false
  const showCode = config.showCode !== false

  const handleTaskClick = (task: any) => {
    if (isPreview) return // Skip navigation in preview mode
    window.dispatchEvent(new CustomEvent('widget-navigate', {
      detail: { type: 'task', id: task.id, projectId: task.project_id }
    }))
  }

  if (tasks.length === 0) {
    return (
      <div className="p-4 h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No tasks found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 space-y-2 overflow-y-auto max-h-full">
      {tasks.map((task: any) => {
        const statusStyle = taskStatusConfig[task.status] || taskStatusConfig.todo
        const priorityStyle = taskPriorityConfig[task.priority] || taskPriorityConfig.medium
        const StatusIcon = statusStyle.icon

        return (
          <div
            key={task.id}
            onClick={() => handleTaskClick(task)}
            className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all hover:shadow-sm cursor-pointer group ${statusStyle.bg} ${statusStyle.border}`}
          >
            {/* Status Icon */}
            <div className={`flex-shrink-0 ${statusStyle.text}`}>
              <StatusIcon className="w-4 h-4" />
            </div>

            {/* Task Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {/* Priority Dot */}
                {showPriority && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${priorityStyle.dot}`}
                    title={task.priority}
                  />
                )}
                <span className="truncate text-gray-900 text-sm font-medium group-hover:text-gray-700">
                  {task.title}
                </span>
              </div>
              {showCode && task.code && (
                <span className="text-xs text-gray-400 font-mono">{task.code}</span>
              )}
            </div>

            {/* Status Badge */}
            <span
              className={`px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`}
            >
              {task.status?.replace(/_/g, ' ')}
            </span>

            {/* Arrow on hover */}
            <ArrowRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </div>
        )
      })}
    </div>
  )
}

// Todo status configuration with icons
const todoStatusConfig: Record<string, { bg: string; text: string; border: string; icon: any }> = {
  pending: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', icon: Circle },
  in_progress: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', icon: Zap },
  completed: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200', icon: CheckCircle2 },
  cancelled: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', icon: Ban },
  on_hold: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200', icon: Pause },
}

// Todo priority configuration
const todoPriorityConfig: Record<string, { color: string; dot: string }> = {
  urgent: { color: 'text-red-600', dot: 'bg-red-500' },
  high: { color: 'text-orange-600', dot: 'bg-orange-500' },
  medium: { color: 'text-yellow-600', dot: 'bg-yellow-500' },
  low: { color: 'text-blue-600', dot: 'bg-blue-400' },
}

// Todo List Widget - Modern todo cards with status indicators
const TodoListContent = ({ widget, data, isPreview = false }: { widget: DashboardWidget; data: any; isPreview?: boolean }) => {
  const todos = data?.items || []
  const config = widget.config || {}
  const showPriority = config.showPriority !== false
  const showDueDate = config.showDueDate !== false

  const handleTodoClick = (todo: any) => {
    if (isPreview) return // Skip navigation in preview mode
    window.dispatchEvent(new CustomEvent('widget-navigate', {
      detail: { type: 'todo', id: todo.id }
    }))
  }

  if (todos.length === 0) {
    return (
      <div className="p-4 h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <ListTodo className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No todos found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 space-y-2 overflow-y-auto max-h-full">
      {todos.map((todo: any) => {
        const statusStyle = todoStatusConfig[todo.status] || todoStatusConfig.pending
        const priorityStyle = todoPriorityConfig[todo.priority] || todoPriorityConfig.medium
        const StatusIcon = statusStyle.icon

        return (
          <div
            key={todo.id}
            onClick={() => handleTodoClick(todo)}
            className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all hover:shadow-sm cursor-pointer group ${statusStyle.bg} ${statusStyle.border}`}
          >
            {/* Status Icon */}
            <div className={`flex-shrink-0 ${statusStyle.text}`}>
              <StatusIcon className="w-4 h-4" />
            </div>

            {/* Todo Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {/* Priority Dot */}
                {showPriority && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${priorityStyle.dot}`}
                    title={todo.priority}
                  />
                )}
                {/* Pinned/Starred indicators */}
                {todo.is_pinned && (
                  <Pin className="w-3 h-3 text-gray-500 flex-shrink-0" />
                )}
                {todo.is_starred && (
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                )}
                <span className="truncate text-gray-900 text-sm font-medium group-hover:text-gray-700">
                  {todo.title}
                </span>
              </div>
              {showDueDate && todo.due_date && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-400">
                    {new Date(todo.due_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {/* Status Badge */}
            <span
              className={`px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`}
            >
              {todo.status?.replace(/_/g, ' ')}
            </span>

            {/* Arrow on hover */}
            <ArrowRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </div>
        )
      })}
    </div>
  )
}

// Project status configuration
const projectStatusConfig: Record<string, { text: string; bg: string; dot: string; progressBar: string }> = {
  active: { text: 'text-green-600', bg: 'bg-green-50', dot: 'bg-green-500', progressBar: 'bg-green-500' },
  on_hold: { text: 'text-yellow-600', bg: 'bg-yellow-50', dot: 'bg-yellow-500', progressBar: 'bg-yellow-500' },
  completed: { text: 'text-blue-600', bg: 'bg-blue-50', dot: 'bg-blue-500', progressBar: 'bg-blue-500' },
  cancelled: { text: 'text-red-600', bg: 'bg-red-50', dot: 'bg-red-500', progressBar: 'bg-red-400' },
}

// Project List Widget - Project cards with progress bars
const ProjectListContent = ({ widget, data, isPreview = false }: { widget: DashboardWidget; data: any; isPreview?: boolean }) => {
  const projects = data?.items || []
  const config = widget.config || {}
  const showProgress = config.showProgress !== false
  const showCode = config.showCode !== false

  const handleProjectClick = (project: any) => {
    if (isPreview) return // Skip navigation in preview mode
    window.dispatchEvent(new CustomEvent('widget-navigate', {
      detail: { type: 'project', id: project.id }
    }))
  }

  if (projects.length === 0) {
    return (
      <div className="p-4 h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <Folder className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No projects found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 space-y-3 overflow-y-auto max-h-full">
      {projects.map((project: any) => {
        const statusStyle = projectStatusConfig[project.status] || projectStatusConfig.active
        const progress = project.progress || 0

        return (
          <div
            key={project.id}
            onClick={() => handleProjectClick(project)}
            className="p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer group bg-white"
          >
            <div className="flex items-start gap-3">
              {/* Project Icon */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${statusStyle.bg} flex items-center justify-center`}>
                <Folder className={`w-4 h-4 ${statusStyle.text}`} />
              </div>

              {/* Project Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-gray-900 font-medium text-sm group-hover:text-gray-700">
                    {project.name}
                  </span>
                  {/* Status dot */}
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusStyle.dot}`} title={project.status} />
                </div>

                {showCode && project.code && (
                  <span className="text-xs text-gray-400 font-mono">{project.code}</span>
                )}

                {/* Progress Bar */}
                {showProgress && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-500">Progress</span>
                      <span className={`font-semibold ${statusStyle.text}`}>{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${statusStyle.progressBar} rounded-full transition-all duration-500`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Alert type configuration
const alertTypeConfig: Record<string, { bg: string; text: string; border: string; icon: any; iconColor: string }> = {
  warning: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
  },
  error: {
    bg: 'bg-red-50',
    text: 'text-red-800',
    border: 'border-red-200',
    icon: XCircle,
    iconColor: 'text-red-500',
  },
  info: {
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    icon: Info,
    iconColor: 'text-blue-500',
  },
  success: {
    bg: 'bg-green-50',
    text: 'text-green-800',
    border: 'border-green-200',
    icon: CheckCircle2,
    iconColor: 'text-green-500',
  },
}

// Alerts List Widget - Alert cards with type-based styling
const AlertsListContent = ({ widget, data }: { widget: DashboardWidget; data: any }) => {
  const alerts = data?.items || []
  const config = widget.config || {}
  const showTimestamp = config.showTimestamp !== false

  if (alerts.length === 0) {
    return (
      <div className="p-4 h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-400" />
          <p className="text-sm text-green-600 font-medium">All clear!</p>
          <p className="text-xs text-gray-400 mt-1">No alerts at this time</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 space-y-2 overflow-y-auto max-h-full">
      {alerts.map((alert: any, index: number) => {
        const typeStyle = alertTypeConfig[alert.type] || alertTypeConfig.info
        const AlertIcon = typeStyle.icon

        return (
          <div
            key={alert.id || index}
            className={`flex items-start gap-3 p-3 rounded-lg border ${typeStyle.bg} ${typeStyle.border} transition-all hover:shadow-sm`}
          >
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              <AlertIcon className={`w-4 h-4 ${typeStyle.iconColor}`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${typeStyle.text}`}>
                {alert.message}
              </p>
              {showTimestamp && alert.time && (
                <div className="flex items-center gap-1 mt-1.5">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">{alert.time}</span>
                </div>
              )}
            </div>

            {/* Dismiss button (visual only) */}
            <button className="flex-shrink-0 p-1 hover:bg-white/50 rounded transition-colors opacity-0 group-hover:opacity-100">
              <XCircle className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

// Welcome Card Widget - Beautiful greeting card with time-based styling
const WelcomeCardContent = ({ widget }: { widget: DashboardWidget }) => {
  const config = widget.config || {}
  const muiTheme = useMuiTheme()
  const isDark = muiTheme.palette.mode === 'dark'
  const now = new Date()
  const hour = now.getHours()

  // Time-based theming
  let greeting = 'Good morning'
  let gradient = 'from-amber-50 via-orange-50 to-yellow-50'
  let textColor = 'text-orange-600'
  let emoji = '☀️'

  if (hour >= 12 && hour < 17) {
    greeting = 'Good afternoon'
    gradient = 'from-sky-50 via-blue-50 to-indigo-50'
    textColor = 'text-blue-600'
    emoji = '🌤️'
  } else if (hour >= 17 && hour < 21) {
    greeting = 'Good evening'
    gradient = 'from-purple-50 via-pink-50 to-rose-50'
    textColor = 'text-purple-600'
    emoji = '🌅'
  } else if (hour >= 21 || hour < 5) {
    greeting = 'Good night'
    gradient = 'from-indigo-50 via-purple-50 to-slate-100'
    textColor = 'text-indigo-600'
    emoji = '🌙'
  }

  return (
    <div 
      className="p-5 h-full flex flex-col justify-center relative overflow-hidden"
      style={{ background: isDark ? 'transparent' : undefined }}
    >
      {!isDark && <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />}
      {/* Decorative elements */}
      <div className="absolute top-2 right-4 text-3xl opacity-20 z-10">{emoji}</div>

      {/* Greeting */}
      {config.showGreeting !== false && (
        <div className="flex items-center gap-2 relative z-10">
          <h2 className={`text-2xl font-bold ${textColor}`}>{greeting}</h2>
          <span className="text-xl">{emoji}</span>
        </div>
      )}

      {/* Date */}
      {config.showDate !== false && (
        <div className="flex items-center gap-2 mt-2 relative z-10">
          <Calendar className="w-4 h-4 text-gray-400" />
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            {now.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      )}

      {/* Optional message */}
      {config.message && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 italic relative z-10">
          "{config.message}"
        </p>
      )}
    </div>
  )
}

// Quick action icons mapping
const quickActionIcons: Record<string, any> = {
  create_task: CheckSquare,
  create_project: Folder,
  view_reports: BarChart3,
  team_members: Users,
  notifications: AlertCircle,
  settings: Circle,
  default: Zap,
}

// Quick action colors
const quickActionColors = [
  { bg: 'bg-blue-50', hover: 'hover:bg-blue-100', text: 'text-blue-600', border: 'border-blue-100' },
  { bg: 'bg-green-50', hover: 'hover:bg-green-100', text: 'text-green-600', border: 'border-green-100' },
  { bg: 'bg-purple-50', hover: 'hover:bg-purple-100', text: 'text-purple-600', border: 'border-purple-100' },
  { bg: 'bg-orange-50', hover: 'hover:bg-orange-100', text: 'text-orange-600', border: 'border-orange-100' },
]

// Quick Actions Widget - Action buttons with icons
const QuickActionsContent = ({ widget }: { widget: DashboardWidget }) => {
  const config = widget.config || {}
  const actions = config.actions || [
    { label: 'New Task', action: 'create_task' },
    { label: 'New Project', action: 'create_project' },
    { label: 'View Reports', action: 'view_reports' },
    { label: 'Team', action: 'team_members' },
  ]
  const layout = config.layout || 'grid' // 'grid' or 'list'

  return (
    <div className="p-4 h-full flex items-center">
      <div className={`w-full ${layout === 'list' ? 'space-y-2' : 'grid grid-cols-2 gap-2'}`}>
        {actions.slice(0, 4).map((action: any, index: number) => {
          const ActionIcon = quickActionIcons[action.action] || quickActionIcons.default
          const color = quickActionColors[index % quickActionColors.length]

          return (
            <button
              key={index}
              className={`flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg transition-all border ${color.bg} ${color.hover} ${color.border} ${color.text} font-medium group`}
            >
              <ActionIcon className="w-4 h-4 transition-transform group-hover:scale-110" />
              <span>{action.label}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Pie/Donut Chart Widget - Simple pie chart visualization
const PieChartContent = ({ widget, data }: { widget: DashboardWidget; data: any }) => {
  const chartData = data?.data || []
  const config = widget.config || {}
  const isDonut = widget.widget_type_code === 'donut_chart'
  const total = chartData.reduce((sum: number, item: any) => sum + (item.value || 0), 0)
  const muiTheme = useMuiTheme()

  if (chartData.length === 0) {
    return (
      <Box sx={{ p: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <Circle sx={{ fontSize: 32, mx: 'auto', mb: 1, opacity: 0.5, color: 'text.disabled' }} />
          <Typography variant="body2" color="text.secondary">No chart data available</Typography>
        </Box>
      </Box>
    )
  }

  // Get color palette from MUI theme
  const colorPalette = [
    { main: muiTheme.palette.primary.main, text: muiTheme.palette.primary.main },
    { main: muiTheme.palette.success.main, text: muiTheme.palette.success.main },
    { main: muiTheme.palette.secondary.main, text: muiTheme.palette.secondary.main },
    { main: muiTheme.palette.warning.main, text: muiTheme.palette.warning.main },
    { main: muiTheme.palette.error.main, text: muiTheme.palette.error.main },
    { main: muiTheme.palette.info.main, text: muiTheme.palette.info.main },
  ]

  // Calculate percentages and create segments
  let cumulativePercent = 0
  const segments = chartData.slice(0, 6).map((item: any, index: number) => {
    const percent = total > 0 ? (item.value / total) * 100 : 0
    const startPercent = cumulativePercent
    cumulativePercent += percent
    return {
      ...item,
      percent,
      startPercent,
      color: colorPalette[index % colorPalette.length],
    }
  })

  return (
    <Box sx={{ p: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
        {/* Pie Chart SVG */}
        <Box sx={{ position: 'relative', flexShrink: 0 }}>
          <svg viewBox="0 0 100 100" style={{ width: 96, height: 96, transform: 'rotate(-90deg)' }}>
            {segments.map((segment: any, index: number) => {
              const strokeDasharray = `${segment.percent} ${100 - segment.percent}`
              const strokeDashoffset = -segment.startPercent
              return (
                <circle
                  key={index}
                  cx="50"
                  cy="50"
                  r={isDonut ? 35 : 40}
                  fill="transparent"
                  stroke={segment.color.text}
                  strokeWidth={isDonut ? 12 : 40}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  pathLength="100"
                />
              )
            })}
          </svg>
          {isDonut && (
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body1" fontWeight="bold" color="text.primary">{total}</Typography>
            </Box>
          )}
        </Box>

        {/* Legend */}
        {config.showLegend !== false && (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.75, overflowY: 'auto', maxHeight: '100%' }}>
            {segments.map((item: any, index: number) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: item.color.main, flexShrink: 0 }} />
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 80 }}>{item.name}</Typography>
                </Box>
                <Typography variant="caption" fontWeight={600} color="text.primary">{item.value}</Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  )
}

// Line/Area Chart Widget - Simple line visualization
const LineChartContent = ({ widget, data }: { widget: DashboardWidget; data: any }) => {
  const chartData = data?.data || []
  const config = widget.config || {}
  const isArea = widget.widget_type_code === 'area_chart'
  const muiTheme = useMuiTheme()

  if (chartData.length === 0) {
    return (
      <Box sx={{ p: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <TrendingUp sx={{ fontSize: 32, mx: 'auto', mb: 1, opacity: 0.5, color: 'text.disabled' }} />
          <Typography variant="body2" color="text.secondary">No chart data available</Typography>
        </Box>
      </Box>
    )
  }

  const maxValue = Math.max(...chartData.map((d: any) => d.value), 1)
  const total = chartData.reduce((sum: number, item: any) => sum + (item.value || 0), 0)

  // Get theme colors from MUI theme based on selected colorTheme
  const getThemeColors = () => {
    const themeName = getWidgetTheme(widget)
    const colorMap: Record<string, { main: string; light: string }> = {
      blue: { main: muiTheme.palette.primary.main, light: muiTheme.palette.primary.light },
      green: { main: muiTheme.palette.success.main, light: muiTheme.palette.success.light },
      purple: { main: muiTheme.palette.secondary.main, light: muiTheme.palette.secondary.light },
      orange: { main: muiTheme.palette.warning.main, light: muiTheme.palette.warning.light },
      pink: { main: muiTheme.palette.error.main, light: muiTheme.palette.error.light },
      cyan: { main: muiTheme.palette.info.main, light: muiTheme.palette.info.light },
      indigo: { main: muiTheme.palette.primary.main, light: muiTheme.palette.primary.light },
      gray: { main: muiTheme.palette.grey[600], light: muiTheme.palette.grey[300] },
    }
    return colorMap[themeName] || colorMap.blue
  }

  const themeColors = getThemeColors()
  const gridColor = muiTheme.palette.mode === 'dark' ? muiTheme.palette.grey[700] : muiTheme.palette.grey[200]

  // Create path for line/area chart
  const points = chartData.map((item: any, index: number) => {
    const x = (index / (chartData.length - 1 || 1)) * 100
    const y = 100 - (item.value / maxValue) * 80 - 10
    return { x, y, ...item }
  })

  const pathD = points.map((p: any, i: number) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaD = `${pathD} L 100 100 L 0 100 Z`

  return (
    <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Chart */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }} preserveAspectRatio="none">
          {/* Grid lines */}
          {config.showGrid !== false && (
            <>
              <line x1="0" y1="25" x2="100" y2="25" stroke={gridColor} strokeWidth="0.5" />
              <line x1="0" y1="50" x2="100" y2="50" stroke={gridColor} strokeWidth="0.5" />
              <line x1="0" y1="75" x2="100" y2="75" stroke={gridColor} strokeWidth="0.5" />
            </>
          )}
          {/* Area fill */}
          {isArea && (
            <path d={areaD} fill={themeColors.light} opacity="0.5" />
          )}
          {/* Line */}
          <path d={pathD} fill="none" stroke={themeColors.main} strokeWidth="2" />
          {/* Dots */}
          {config.showDots !== false && points.map((p: any, i: number) => (
            <circle key={i} cx={p.x} cy={p.y} r="2" fill={themeColors.main} />
          ))}
        </svg>
      </Box>

      {/* Legend / Total */}
      <Box sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="caption" color="text.secondary">{chartData.length} data points</Typography>
        <Typography variant="body2" fontWeight={600} color="text.primary">Total: {total}</Typography>
      </Box>
    </Box>
  )
}

// Data Table Widget - Enhanced table display with clickable rows
const DataTableContent = ({ widget, data, isPreview = false }: { widget: DashboardWidget; data: any; isPreview?: boolean }) => {
  const items = data?.items || data?.data || []
  const config = widget.config || {}
  const dataType = data?.type || widget.data_source?.split('.')[0] || 'generic'

  // Handle stats-type data (value/label format)
  if (data?.value !== undefined && data?.label) {
    return (
      <div className="p-4 h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl font-bold text-gray-900">{data.value}</p>
          <p className="text-sm text-gray-500 mt-1">{data.label}</p>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="p-4 h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No data available</p>
        </div>
      </div>
    )
  }

  // Status badge styling
  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      backlog: 'bg-gray-100 text-gray-700',
      todo: 'bg-blue-100 text-blue-700',
      in_progress: 'bg-yellow-100 text-yellow-700',
      in_review: 'bg-purple-100 text-purple-700',
      done: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
      pending: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      active: 'bg-green-100 text-green-700',
      on_hold: 'bg-orange-100 text-orange-700',
    }
    const style = statusStyles[status] || 'bg-gray-100 text-gray-700'
    const label = status.replace(/_/g, ' ')
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${style}`}>
        {label}
      </span>
    )
  }

  // Priority badge styling
  const getPriorityBadge = (priority: string) => {
    const priorityStyles: Record<string, string> = {
      lowest: 'bg-gray-100 text-gray-600',
      low: 'bg-blue-100 text-blue-600',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700',
      urgent: 'bg-red-100 text-red-700',
    }
    const style = priorityStyles[priority] || 'bg-gray-100 text-gray-600'
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${style}`}>
        {priority}
      </span>
    )
  }

  // Handle row click for navigation
  const handleRowClick = (item: any) => {
    if (isPreview) return // Skip navigation in preview mode

    if (dataType === 'tasks' && item.id) {
      // Navigate to task - dispatch custom event that parent can listen to
      window.dispatchEvent(new CustomEvent('widget-navigate', {
        detail: { type: 'task', id: item.id, projectId: item.project_id }
      }))
    } else if (dataType === 'todos' && item.id) {
      window.dispatchEvent(new CustomEvent('widget-navigate', {
        detail: { type: 'todo', id: item.id }
      }))
    } else if (dataType === 'projects' && item.id) {
      window.dispatchEvent(new CustomEvent('widget-navigate', {
        detail: { type: 'project', id: item.id }
      }))
    }
  }

  // Task-specific table rendering
  if (dataType === 'tasks') {
    return (
      <div className="h-full overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
              {items[0]?.assigned_to && (
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.slice(0, config.maxRows || 10).map((item: any, index: number) => (
              <tr
                key={item.id || index}
                onClick={() => handleRowClick(item)}
                className="hover:bg-blue-50 cursor-pointer transition-colors"
              >
                <td className="px-3 py-2">
                  <span className="font-mono text-xs text-blue-600 font-medium">{item.code}</span>
                </td>
                <td className="px-3 py-2 text-gray-900 truncate max-w-[200px]" title={item.title}>
                  {item.title}
                </td>
                <td className="px-3 py-2">{getStatusBadge(item.status)}</td>
                <td className="px-3 py-2">{getPriorityBadge(item.priority)}</td>
                {items[0]?.assigned_to && (
                  <td className="px-3 py-2 text-gray-600 text-xs truncate max-w-[100px]">
                    {item.assigned_to || '-'}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // Todo-specific table rendering
  if (dataType === 'todos') {
    return (
      <div className="h-full overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.slice(0, config.maxRows || 10).map((item: any, index: number) => (
              <tr
                key={item.id || index}
                onClick={() => handleRowClick(item)}
                className="hover:bg-blue-50 cursor-pointer transition-colors"
              >
                <td className="px-3 py-2 text-gray-900 truncate max-w-[200px]" title={item.title}>
                  <div className="flex items-center gap-1.5">
                    {item.is_pinned && <Pin className="w-3 h-3 text-blue-500" />}
                    {item.is_starred && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                    <span>{item.title}</span>
                  </div>
                </td>
                <td className="px-3 py-2">{getStatusBadge(item.status)}</td>
                <td className="px-3 py-2">{getPriorityBadge(item.priority)}</td>
                <td className="px-3 py-2 text-gray-500 text-xs">
                  {item.due_date ? new Date(item.due_date).toLocaleDateString() : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // Generic table for other data types
  const firstItem = items[0]
  const columns = Object.keys(firstItem).filter(key =>
    !['id', 'created_at', 'updated_at', 'project_id', 'is_pinned', 'is_starred'].includes(key)
  ).slice(0, 5)

  return (
    <div className="h-full overflow-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            {columns.map((col) => (
              <th key={col} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {col.replace(/_/g, ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.slice(0, config.maxRows || 10).map((item: any, index: number) => (
            <tr
              key={item.id || index}
              onClick={() => handleRowClick(item)}
              className={`hover:bg-gray-50 ${item.id ? 'cursor-pointer' : ''} transition-colors`}
            >
              {columns.map((col) => (
                <td key={col} className="px-3 py-2 text-gray-700 truncate max-w-[150px]">
                  {col === 'status' ? getStatusBadge(item[col]) :
                   col === 'priority' ? getPriorityBadge(item[col]) :
                   typeof item[col] === 'object' ? JSON.stringify(item[col]) : String(item[col] ?? '-')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Progress Ring Widget - Circular progress indicator
const ProgressRingContent = ({ widget, data }: { widget: DashboardWidget; data: any }) => {
  const config = widget.config || {}
  const muiTheme = useMuiTheme()
  const theme = getColorThemes(muiTheme)[getWidgetTheme(widget)]
  const isDark = muiTheme.palette.mode === 'dark'
  const value = data?.value || data?.progress || 0
  const max = data?.max || 100
  const progress = Math.min((value / max) * 100, 100)
  const label = data?.label || 'Progress'

  // SVG circle parameters
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <Box sx={{ p: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: isDark ? 'transparent' : theme.bgLight }}>
      <Box sx={{ textAlign: 'center' }}>
        {/* Progress Ring */}
        <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg style={{ width: 96, height: 96, transform: 'rotate(-90deg)' }}>
            {/* Background circle */}
            <circle
              cx="48"
              cy="48"
              r={radius}
              fill="none"
              stroke={muiTheme.palette.grey[300]}
              strokeWidth="8"
            />
            {/* Progress circle */}
            <circle
              cx="48"
              cy="48"
              r={radius}
              fill="none"
              stroke={theme.primary}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          {/* Center text */}
          {config.showLabel !== false && (
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="h6" fontWeight={700} sx={{ color: theme.primary }}>{Math.round(progress)}%</Typography>
            </Box>
          )}
        </Box>
        {/* Label */}
        <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mt: 1 }}>{label}</Typography>
      </Box>
    </Box>
  )
}

// Placeholder for unsupported widget types - Styled with helpful info
// Calendar Preview Widget - Mini calendar with upcoming events
const CalendarPreviewContent = ({ widget, data }: { widget: DashboardWidget; data: any }) => {
  const events = data?.events || []

  const getEventColor = (event: any) => {
    if (event.type === 'action') return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800'
    // Task - color by priority
    switch (event.priority) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800'
      case 'medium': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
      default: return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (d.toDateString() === today.toDateString()) return 'Today'
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  // Group events by date
  const grouped: Record<string, any[]> = {}
  for (const event of events) {
    const key = event.date || 'unknown'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(event)
  }

  if (events.length === 0) {
    return (
      <div className="p-4 h-full flex items-center justify-center">
        <div className="text-center">
          <Calendar className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No upcoming events</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Next 7 days are clear</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 h-full overflow-y-auto space-y-3">
      {Object.entries(grouped).map(([date, dateEvents]) => (
        <div key={date}>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {formatDate(date)}
            </span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="space-y-1">
            {dateEvents.map((event: any) => (
              <div
                key={event.id}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs ${getEventColor(event)}`}
              >
                <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                <span className="flex-1 truncate font-medium">{event.title}</span>
                {event.time && <span className="flex-shrink-0 opacity-70">{event.time}</span>}
                {event.project_code && (
                  <span className="flex-shrink-0 opacity-50 text-[10px]">{event.project_code}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

const PlaceholderContent = ({ widget }: { widget: DashboardWidget }) => {
  return (
    <div className="p-4 h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gray-200 flex items-center justify-center">
          <BarChart3 className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-600">{(widget as any).widget_type_name || 'Widget'}</p>
        <p className="text-xs text-gray-400 mt-1">Preview not available</p>
        <div className="mt-3 px-3 py-1.5 bg-white rounded-md border border-gray-200 inline-flex items-center gap-1.5 text-xs text-gray-500">
          <Info className="w-3 h-3" />
          <span>Type: {widget.widget_type_code}</span>
        </div>
      </div>
    </div>
  )
}

export default WidgetRenderer
