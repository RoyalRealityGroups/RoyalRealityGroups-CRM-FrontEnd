/**
 * Dashboard Page - Sales Application
 *
 * Executive dashboard for sales operations with real-time metrics,
 * order analytics, and activity tracking
 */
import { useNavigate } from 'react-router-dom'
import { useAppSelector } from '../../store/hooks';
import { hasPermission } from '../../utils/permissions';
import { useTheme, Box, Typography, Grid, Paper, Button, Tabs, Tab } from '@mui/material';
import { Dashboard as DashboardIcon } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { dashboardsApi, type DashboardListItem } from '../../api/dashboards.api';
import { salesOrderApi } from '../../api/sales.api';
import { dispatchApi } from '../../api/dispatch.api';
import { invoiceApi } from '../../api/invoice.api';
import { podApi } from '../../api/pod.api';
import { activityApi } from '../../api/activity.api';
import apiClient from '../../api/axios.config';
import DashboardViewer from '../../components/dashboard/DashboardViewer';
import StatsCard from '../../components/ui/StatsCard'
import ActivityFeed from '../../components/features/ActivityFeed';
import type { Activity } from '../../components/features/ActivityFeed'
import { AreaChartCard, DonutChartCard, BarChartCard } from '../../components/ui/Charts'
import {
  ShoppingCart as ShoppingCartIcon,
  Receipt as ReceiptIcon,
  LocalShipping as TruckIcon,
  AttachMoney as DollarSignIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as ClipboardListIcon,
  Close as CloseIcon,
} from '@mui/icons-material'

const DashboardPage = () => {
  const navigate = useNavigate()
  const { user } = useAppSelector((state) => state.auth)
  const storePermissions = useAppSelector((state) => state.permissions.permissions)
  const theme = useTheme()
  const isDarkMode = theme.palette.mode === 'dark'
  const [dashboards, setDashboards] = useState<DashboardListItem[]>([])
  const [selectedDashboard, setSelectedDashboard] = useState<string | null>(null)
  const [orderStatusCount, setOrderStatusCount] = useState<{ [key: string]: number }>({})
  const [dispatchStatusCount, setDispatchStatusCount] = useState<{ [key: string]: number }>({})
  const [invoiceStatusCount, setInvoiceStatusCount] = useState<{ [key: string]: number }>({})
  const [podStatusCount, setPodStatusCount] = useState<{ [key: string]: number }>({})
  const [totalRevenue, setTotalRevenue] = useState<string>('₹0')
  const [fulfillmentPercentage, setFulfillmentPercentage] = useState<string>('0%')
  const [weeklyCustomerData, setWeeklyCustomerData] = useState<any[]>([])
  const [salesTrendData, setSalesTrendData] = useState<any[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [allActivities, setAllActivities] = useState<Activity[]>([])
  const [activityDrawerOpen, setActivityDrawerOpen] = useState(false)
  const [loadingStats, setLoadingStats] = useState(true)
  const [activityPage, setActivityPage] = useState(1)
  const [hasMoreActivities, setHasMoreActivities] = useState(true)
  const [loadingMoreActivities, setLoadingMoreActivities] = useState(false)

  // Check view_recentactivity permission from both user.permissions and permissionsSlice
  const canViewRecentActivity = (() => {
    const perm = 'view_recentactivity';
    const allPerms: any[] = [...(user?.permissions || []), ...storePermissions];
    return allPerms.some(p => {
      if (typeof p !== 'string') return false;
      return p === perm || (p.includes('.') && p.split('.')[1] === perm);
    });
  })();

useEffect(()=>{
  console.log("User role:", user)
},[user])
  // Load dashboards and order stats
  useEffect(() => {
    const loadDashboards = async () => {
      try {
        const response = await dashboardsApi.list({ page_size: 100 })
        setDashboards(response.data)
      } catch (error) {
        console.error('Failed to load dashboards:', error)
      }
    }

    const loadOrderStats = async () => {
      try {
        setLoadingStats(true)
        const statusCount = await salesOrderApi.getStatusCount()
        setOrderStatusCount(statusCount)
      } catch (error) {
        console.error('Failed to load order stats:', error)
      } finally {
        setLoadingStats(false)
      }
    }

    const loadDispatchStats = async () => {
      try {
        const statusCount = await dispatchApi.getStatusCount()
        setDispatchStatusCount(statusCount)
      } catch (error) {
        console.error('Failed to load dispatch stats:', error)
      }
    }

    const loadInvoiceStats = async () => {
      try {
        const statusCount = await invoiceApi.getStatusCount()
        setInvoiceStatusCount(statusCount)
      } catch (error) {
        console.error('Failed to load invoice stats:', error)
      }
    }

    const loadPodStats = async () => {
      try {
        const statusCount = await podApi.getStatusCount()
        setPodStatusCount(statusCount)
      } catch (error) {
        console.error('Failed to load POD stats:', error)
      }
    }

    const loadTotalRevenue = async () => {
      try {
        const response = await apiClient.get('/api/receipts/total-amount/')
        const amount = Number(response.data.total_amount || response.data.total || 0)
        setTotalRevenue(`₹${amount.toLocaleString('en-IN')}`)
      } catch (error) {
        console.error('Failed to load total revenue:', error)
      }
    }

    const loadFulfillmentPercentage = async () => {
      try {
        const response = await apiClient.get('/api/sales/orders/fulfilment-percentage/')
        const pct = Number(response.data.fulfilment_percentage || response.data.percentage || 0)
        setFulfillmentPercentage(`${pct.toFixed(0)}%`)
      } catch (error) {
        console.error('Failed to load fulfillment percentage:', error)
      }
    }

    const loadSalesTrend = async () => {
      try {
        const response = await apiClient.get('/api/receipts/last-week-daily-total/')
        const data = response.data
        if (data?.daily_totals && Array.isArray(data.daily_totals)) {
          const chartData = data.daily_totals.map((item: any) => ({
            name: item.date || '',
            revenue: Number(item.total_amount || 0),
          }))
          setSalesTrendData(chartData)
        }
      } catch (error) {
        console.error('Failed to load sales trend:', error)
      }
    }

    const loadWeeklyCustomerData = async () => {
      try {
        const [retailer, distributor, superstockist] = await Promise.all([
          salesOrderApi.getWeeklyCustomerCount('RETAILER'),
          salesOrderApi.getWeeklyCustomerCount('DISTRIBUTOR'),
          salesOrderApi.getWeeklyCustomerCount('SUPERSTOCKIST'),
        ])

        // Transform API data to chart format
        const weekKeys = Object.keys(retailer.weeks || {})
        const chartData = weekKeys.map((weekKey: string) => {
          const retailerWeek = retailer.weeks[weekKey]
          const distributorWeek = distributor.weeks[weekKey]
          const superstockistWeek = superstockist.weeks[weekKey]
          
          return {
            name: `${retailerWeek.start_date} to ${retailerWeek.end_date}`,
            Retailer: retailerWeek?.count || 0,
            Distributor: distributorWeek?.count || 0,
            Superstockist: superstockistWeek?.count || 0,
          }
        })
        setWeeklyCustomerData(chartData)
      } catch (error) {
        console.error('Failed to load weekly customer data:', error)
      }
    }

    const loadUserActivities = async () => {
      try {
        const response = await activityApi.getUserActivityLogs()
        const activityLogs = response.results || response
        
        // Transform API data to Activity format
        const transformedActivities: Activity[] = activityLogs.slice(0, 5).map((log: any) => {
          // Parse timestamp safely
          let timestamp = new Date()
          try {
            if (log.created_on) {
              timestamp = new Date(log.created_on)
              // Check if date is valid
              if (isNaN(timestamp.getTime())) {
                timestamp = new Date()
              }
            }
          } catch (e) {
            timestamp = new Date()
          }

          // Map type to action type
          const actionTypeMap: { [key: string]: string } = {
            'Create': 'created',
            'Update': 'updated',
            'Delete': 'deleted',
            'Approve': 'approved',
            'Reject': 'rejected',
          }

          return {
            id: log.id,
            type: actionTypeMap[log.type_name] || 'updated',
            user: {
              name: log.user?.fullname?.trim() || log.user?.username || user?.first_name || user?.username || 'User',
              email: log.user?.email || user?.email || '',
            },
            entity: log.screen_name?.toLowerCase() || 'record',
            entityName: log.instance_code || log.id,
            timestamp,
            description: `${log.type_name} ${log.screen_name} ${log.instance_code}`,
          }
        })
        setActivities(transformedActivities)
      } catch (error) {
        console.error('Failed to load user activities:', error)
      }
    }

    loadDashboards()
    loadOrderStats()
    loadDispatchStats()
    loadInvoiceStats()
    loadPodStats()
    loadTotalRevenue()
    loadFulfillmentPercentage()
    loadSalesTrend()
    loadWeeklyCustomerData()
    loadUserActivities()
  }, [])

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const handleDashboardChange = (_event: React.SyntheticEvent, newValue: string) => {
    setSelectedDashboard(newValue)
  }

  const handleDefaultDashboard = () => {
    setSelectedDashboard(null)
  }

  // Sales metrics data
  
  const stats = {
    totalOrders: { value: orderStatusCount?.PENDING || 0 },
    pendingInvoices: { value: invoiceStatusCount?.PENDING || 0 },
    activeDispatches: { value: dispatchStatusCount?.PENDING || 0 },
    totalRevenue: { value: totalRevenue },
    orderFulfillment: { value: fulfillmentPercentage },
    pendingPODs: { value: podStatusCount?.PENDING || 0 },
  }

  // Sales trend data (last 7 days) - from API or fallback
  const salesTrendChartData = salesTrendData.length > 0 ? salesTrendData : (() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({ name: d.toISOString().split('T')[0], revenue: 0 });
    }
    return days;
  })()

  // Order status distribution
  const orderStatusData = [
    { name: 'Confirmed', value: orderStatusCount['CONFIRMED'] || 0, color: '#00A27B' },
    { name: 'Pending', value: orderStatusCount['PENDING'] || 0, color: '#F2AC57' },
    { name: 'Dispatched', value: orderStatusCount['DISPATCHED'] || 0, color: '#0091AE' },
    { name: 'Delivered', value: orderStatusCount['DELIVERED'] || 0, color: '#7C98B6' },
  ]

  // Customer type distribution (last 4 weeks)
  const customerTypeData = weeklyCustomerData.length > 0 ? weeklyCustomerData : [
    { name: 'Week 1', Retailer: 0, Distributor: 0, Superstockist: 0 },
    { name: 'Week 2', Retailer: 0, Distributor: 0, Superstockist: 0 },
    { name: 'Week 3', Retailer: 0, Distributor: 0, Superstockist: 0 },
    { name: 'Week 4', Retailer: 0, Distributor: 0, Superstockist: 0 },
  ]

  // Recent activity data
  const fallbackActivities: Activity[] = [
    {
      id: '1',
      type: 'created',
      user: {
        name: user?.first_name || 'Sales User',
        email: user?.email || 'sales@example.com',
      },
      entity: 'order',
      entityName: 'SO-2024-00156',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      description: 'Created new sales order worth ₹45,000',
    },
  ]

  return (
    <Box 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden',
        bgcolor: isDarkMode ? 'transparent' : 'grey.100'
      }}
    >
      {/* Welcome Section - Fixed Header */}
      <Box sx={{ 
        bgcolor: 'transparent', 
        borderBottom: 1, 
        borderColor: 'divider',
        flexShrink: 0 
      }}>
        <Box sx={{ px: { xs: 2, sm: 3 }, py: 0.75 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {getGreeting()}, {user?.first_name || user?.username}! 👋
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            Here's your sales overview for today
          </Typography>
        </Box>

        {/* Dashboard Tabs */}
        <Box sx={{ borderTop: 1, borderColor: 'divider', px: { xs: 2, sm: 3 }, py: 0.75 }}>
          <Tabs
            value={selectedDashboard || false}
            onChange={handleDashboardChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTabs-indicator': {
                backgroundColor: 'primary.main',
              },
            }}
          >
            <Tab
              value={false}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DashboardIcon sx={{ fontSize: 18 }} />
                  <Typography variant="body2">Default Dashboard</Typography>
                </Box>
              }
              onClick={handleDefaultDashboard}
              sx={{
                textTransform: 'none',
                minHeight: 32,
                py: 0.5,
              }}
            />
            {dashboards.map((dashboard) => (
              <Tab
                key={dashboard.id}
                value={dashboard.id}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DashboardIcon sx={{ fontSize: 18 }} />
                    <Typography variant="body2">{dashboard.name}</Typography>
                    {dashboard.is_default && (
                      <Box
                        sx={{
                          bgcolor: 'success.main',
                          color: 'white',
                          px: 1,
                          py: 0.25,
                          borderRadius: 1,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                        }}
                      >
                        Default
                      </Box>
                    )}
                  </Box>
                }
                sx={{
                  textTransform: 'none',
                  minHeight: 32,
                  py: 0.5,
                }}
              />
            ))}
          </Tabs>
        </Box>
      </Box>

      {/* Scrollable Content */}
      <Box sx={{ flex: 1, overflow: 'auto', px: { xs: 2, sm: 3 }, py: 2, pb: 4 }}>
      {selectedDashboard ? (
        <DashboardViewer dashboardId={selectedDashboard} />
      ) : (
        <>
      {/* KPI Metrics Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <StatsCard
          title="Pending Orders"
          value={stats.totalOrders.value}
          icon={ShoppingCartIcon}
          color="primary"
          // onClick={() => navigate('/sales/orders')}
        />
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <StatsCard
          title="Pending Invoices"
          value={stats.pendingInvoices.value}
          icon={ReceiptIcon}
          color="warning"
          // onClick={() => navigate('/sales/invoice')}
        />
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <StatsCard
          title="Pending Dispatches"
          value={stats.activeDispatches.value}
          icon={TruckIcon}
          color="info"
          // onClick={() => navigate('/sales/dispatch')}
        />
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <StatsCard
          title="Total Revenue"
          value={stats.totalRevenue.value}
          icon={DollarSignIcon}
          color="success"
          // onClick={() => navigate('/receipts')}
        />
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <StatsCard
          title="Order Fulfillment"
          value={stats.orderFulfillment.value}
          icon={TrendingUpIcon}
          color="secondary"
        />
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <StatsCard
          title="Pending PODs"
          value={stats.pendingPODs.value}
          icon={ClipboardListIcon}
          color="error"
          // onClick={() => navigate('/sales/pod')}
        />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, lg: 6 }}>
        {/* Sales Revenue Trend */}
        <AreaChartCard
          data={salesTrendChartData}
          dataKey="revenue"
          xAxisKey="name"
          title="Sales Revenue Trend (Last 7 Days)"
          color="#00A27B"
          formatter={(value) => `₹${(value / 1000).toFixed(1)}K`}
        />
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
        {/* Order Status Distribution */}
        <DonutChartCard
          data={orderStatusData}
          title="Order Status Distribution"
          formatter={(value) => `${value} orders`}
          showLegendValues={true}
        />
        </Grid>
      </Grid>

      {/* Bottom Section */}
      <Grid container spacing={3}>
        {/* Customer Type Analysis */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <BarChartCard
            data={customerTypeData}
            dataKeys={['Retailer', 'Distributor', 'Superstockist']}
            xAxisKey="name"
            title="Orders by Customer Type (Last 4 Weeks)"
            colors={['#0091AE', '#00A27B', '#F2AC57']}
            formatter={(value) => `${value} orders`}
          />
        </Grid>

        {/* Recent Activity Feed */}
        {canViewRecentActivity && (
        <Grid size={{ xs: 12, lg: 4 }}>
        <Paper sx={{ p: 3, border: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Recent Activity</Typography>
            <Button
              onClick={async () => {
                setActivityDrawerOpen(true)
                setActivityPage(1)
                setHasMoreActivities(true)
                try {
                  const response = await activityApi.getUserActivityLogs(true, 1)
                  const activityLogs = response.results || response
                  
                  // Transform API data to Activity format
                  const transformedActivities: Activity[] = activityLogs.map((log: any) => {
                    let timestamp = new Date()
                    try {
                      if (log.created_on) {
                        timestamp = new Date(log.created_on)
                        if (isNaN(timestamp.getTime())) {
                          timestamp = new Date()
                        }
                      }
                    } catch (e) {
                      timestamp = new Date()
                    }

                    const actionTypeMap: { [key: string]: string } = {
                      'Create': 'created',
                      'Update': 'updated',
                      'Delete': 'deleted',
                      'Approve': 'approved',
                      'Reject': 'rejected',
                    }

                    return {
                      id: log.id,
                      type: actionTypeMap[log.type_name] || 'updated',
                      user: {
                        name: log.user?.fullname?.trim() || log.user?.username || user?.first_name || user?.username || 'User',
                        email: log.user?.email || user?.email || '',
                      },
                      entity: log.screen_name?.toLowerCase() || 'record',
                      entityName: log.instance_code || log.id,
                      timestamp,
                      description: `${log.type_name} ${log.screen_name} ${log.instance_code}`,
                    }
                  })
                  setAllActivities(transformedActivities)
                  setHasMoreActivities(response.next !== null)
                } catch (error) {
                  console.error('Failed to load all activities:', error)
                }
              }}
              size="small"
              sx={{ textTransform: 'none' }}
            >
              View all
            </Button>
          </Box>
          <ActivityFeed activities={activities.length > 0 ? activities : fallbackActivities} maxItems={5} />
        </Paper>
        </Grid>
        )}
      </Grid>

      {/* Quick Actions Section */}
      <Box sx={{ 
        mt: 4, 
        background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(25, 118, 210, 0.05) 100%)',
        border: 1,
        borderColor: 'primary.light',
        borderRadius: 1,
        p: 3 
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Quick Actions</Typography>
        <Grid container spacing={2}>
          {hasPermission(user, 'add_salesorder') && (
          <Grid size={{ xs: 6, md: 3 }}>
          <Paper
            onClick={() => navigate('/sales/orders/create')}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 2,
              cursor: 'pointer',
              border: 1,
              borderColor: 'divider',
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: 'action.hover',
                '& .icon': {
                  transform: 'scale(1.1)'
                }
              }
            }}
          >
            <ShoppingCartIcon className="icon" sx={{ fontSize: 32, color: 'primary.main', mb: 1, transition: 'transform 0.2s' }} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>New Order</Typography>
          </Paper>
          </Grid>
          )}
          {hasPermission(user, 'add_invoice') && (
          <Grid size={{ xs: 6, md: 3 }}>
          <Paper
            onClick={() => navigate('/sales/invoice/create')}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 2,
              cursor: 'pointer',
              border: 1,
              borderColor: 'divider',
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: 'action.hover',
                '& .icon': {
                  transform: 'scale(1.1)'
                }
              }
            }}
          >
            <ReceiptIcon className="icon" sx={{ fontSize: 32, color: 'warning.main', mb: 1, transition: 'transform 0.2s' }} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>Create Invoice</Typography>
          </Paper>
          </Grid>
          )}
          {hasPermission(user, 'add_dispatchplan') && (
          <Grid size={{ xs: 6, md: 3 }}>
          <Paper
            onClick={() => navigate('/sales/dispatch/new')}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 2,
              cursor: 'pointer',
              border: 1,
              borderColor: 'divider',
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: 'action.hover',
                '& .icon': {
                  transform: 'scale(1.1)'
                }
              }
            }}
          >
            <TruckIcon className="icon" sx={{ fontSize: 32, color: 'info.main', mb: 1, transition: 'transform 0.2s' }} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>New Dispatch</Typography>
          </Paper>
          </Grid>
          )}
          {hasPermission(user, 'add_receipt') && (
          <Grid size={{ xs: 6, md: 3 }}>
          <Paper
            onClick={() => navigate('/receipts/create')}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 2,
              cursor: 'pointer',
              border: 1,
              borderColor: 'divider',
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: 'action.hover',
                '& .icon': {
                  transform: 'scale(1.1)'
                }
              }
            }}
          >
            <DollarSignIcon className="icon" sx={{ fontSize: 32, color: 'success.main', mb: 1, transition: 'transform 0.2s' }} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>Record Receipt</Typography>
          </Paper>
          </Grid>
          )}
        </Grid>
      </Box>
      </>
      )}
      </Box>

      {/* Activity Drawer */}
      {canViewRecentActivity && (
      <Box
        component="aside"
        sx={{
          position: 'fixed',
          top: 0,
          right: activityDrawerOpen ? 0 : '-400px',
          width: 400,
          height: '100vh',
          bgcolor: 'background.paper',
          boxShadow: activityDrawerOpen ? 24 : 0,
          transition: 'right 0.3s ease-in-out',
          zIndex: 1300,
          display: 'flex',
          flexDirection: 'column',
          borderLeft: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ p: 2, pt: 8, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>All Activities</Typography>
          <Button
            onClick={() => 
             setActivityDrawerOpen(false)}
            size="small"
            variant="outlined"
            sx={{ 
              minWidth: 'auto', 
              p: 1,
              borderRadius: 1,
              border: 1,
              borderColor: 'divider',
              '&:hover': {
                bgcolor: 'action.hover',
                borderColor: 'primary.main',
              }
            }}
          >
            <CloseIcon fontSize="small" />
          </Button>
        </Box>
        <Box 
          sx={{ flex: 1, overflow: 'auto', p: 2 }}
          onScroll={async (e) => {
            const target = e.target as HTMLElement
            const bottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50
            
            if (bottom && hasMoreActivities && !loadingMoreActivities) {
              setLoadingMoreActivities(true)
              try {
                const nextPage = activityPage + 1
                const response = await activityApi.getUserActivityLogs(true, nextPage)
                const activityLogs = response.results || response
                
                const transformedActivities: Activity[] = activityLogs.map((log: any) => {
                  let timestamp = new Date()
                  try {
                    if (log.created_on) {
                      timestamp = new Date(log.created_on)
                      if (isNaN(timestamp.getTime())) {
                        timestamp = new Date()
                      }
                    }
                  } catch (e) {
                    timestamp = new Date()
                  }

                  const actionTypeMap: { [key: string]: string } = {
                    'Create': 'created',
                    'Update': 'updated',
                    'Delete': 'deleted',
                    'Approve': 'approved',
                    'Reject': 'rejected',
                  }

                  return {
                    id: log.id,
                    type: actionTypeMap[log.type_name] || 'updated',
                    user: {
                      name: log.user?.fullname?.trim() || log.user?.username || user?.first_name || user?.username || 'User',
                      email: log.user?.email || user?.email || '',
                    },
                    entity: log.screen_name?.toLowerCase() || 'record',
                    entityName: log.instance_code || log.id,
                    timestamp,
                    description: `${log.type_name} ${log.screen_name} ${log.instance_code}`,
                  }
                })
                
                setAllActivities(prev => [...prev, ...transformedActivities])
                setActivityPage(nextPage)
                setHasMoreActivities(response.next !== null)
              } catch (error) {
                console.error('Failed to load more activities:', error)
              } finally {
                setLoadingMoreActivities(false)
              }
            }
          }}
        >
          <ActivityFeed activities={allActivities.length > 0 ? allActivities : (activities.length > 0 ? activities : fallbackActivities)} maxItems={100} />
          {loadingMoreActivities && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <Typography variant="body2" color="text.secondary">Loading more...</Typography>
            </Box>
          )}
        </Box>
      </Box>
      )}

      {/* Backdrop */}
      {activityDrawerOpen && (
        <Box
          onClick={() => setActivityDrawerOpen(false)}
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1299,
          }}
        />
      )}
    </Box>
  )
}

export default DashboardPage
