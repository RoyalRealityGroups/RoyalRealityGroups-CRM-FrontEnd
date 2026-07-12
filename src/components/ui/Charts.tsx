/**
 * Chart Components
 *
 * Professional chart wrappers using Recharts with MUI styling
 * Consistent styling and responsive design
 */
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Box, Typography, Paper, useTheme } from '@mui/material'

// Brand colors for charts
export const CHART_COLORS = {
  primary: '#002329',
  secondary: '#0091AE',
  success: '#00A27B',
  warning: '#F2AC57',
  error: '#E85D75',
  info: '#0091AE',
  purple: '#9B59B6',
  teal: '#00A4BD',
  gray: '#7C98B6',
}

export const CHART_PALETTE = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.info,
  CHART_COLORS.purple,
  CHART_COLORS.teal,
]

// Custom Tooltip
interface CustomTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
  formatter?: (value: any) => string
}

const CustomTooltip = ({ active, payload, label, formatter }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <Paper sx={{ px: 2, py: 1.5, border: 1, borderColor: 'divider' }}>
        {label && (
          <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
            {label}
          </Typography>
        )}
        {payload.map((entry: any, index: number) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: 0.5,
                bgcolor: entry.color,
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {entry.name}:
            </Typography>
            <Typography variant="caption" fontWeight="medium">
              {formatter ? formatter(entry.value) : entry.value}
            </Typography>
          </Box>
        ))}
      </Paper>
    )
  }
  return null
}

// Area Chart Component
interface AreaChartData {
  name: string
  [key: string]: any
}

interface AreaChartCardProps {
  data: AreaChartData[]
  dataKey: string
  xAxisKey: string
  title?: string
  color?: string
  height?: number
  formatter?: (value: any) => string
}

export const AreaChartCard = ({
  data,
  dataKey,
  xAxisKey,
  title,
  color = CHART_COLORS.primary,
  height = 300,
  formatter,
}: AreaChartCardProps) => {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  return (
    <Paper sx={{ p: 3, border: 1, borderColor: 'divider' }}>
      {title && (
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          {title}
        </Typography>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`color${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
          />
          <XAxis
            dataKey={xAxisKey}
            stroke={theme.palette.text.secondary}
            style={{ fontSize: '11px' }}
            interval={0}
            angle={-35}
            textAnchor="end"
            height={60}
          />
          <YAxis stroke={theme.palette.text.secondary} style={{ fontSize: '12px' }} />
          <Tooltip content={<CustomTooltip formatter={formatter} />} />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fillOpacity={1}
            fill={`url(#color${dataKey})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Paper>
  )
}

// Bar Chart Component
interface BarChartCardProps {
  data: any[]
  dataKey?: string
  dataKeys?: string[]
  xAxisKey: string
  title?: string
  color?: string
  colors?: string[]
  height?: number
  formatter?: (value: any) => string
}

export const BarChartCard = ({
  data,
  dataKey,
  dataKeys,
  xAxisKey,
  title,
  color = CHART_COLORS.primary,
  colors = [CHART_COLORS.primary, CHART_COLORS.secondary, CHART_COLORS.success],
  height = 300,
  formatter,
}: BarChartCardProps) => {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  return (
    <Paper sx={{ p: 3, border: 1, borderColor: 'divider' }}>
      {title && (
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          {title}
        </Typography>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
          />
          <XAxis
            dataKey={xAxisKey}
            stroke={theme.palette.text.secondary}
            style={{ fontSize: '11px' }}
            angle={-15}
            textAnchor="end"
            height={80}
          />
          <YAxis stroke={theme.palette.text.secondary} style={{ fontSize: '12px' }} />
          <Tooltip content={<CustomTooltip formatter={formatter} />} />
          {dataKeys && dataKeys.length > 1 && (
            <Legend
              verticalAlign="top"
              height={36}
              iconType="rect"
              wrapperStyle={{ fontSize: '12px' }}
            />
          )}
          {dataKeys ? (
            dataKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={colors[index % colors.length]}
                radius={[4, 4, 0, 0]}
              />
            ))
          ) : (
            <Bar dataKey={dataKey!} fill={color} radius={[4, 4, 0, 0]} />
          )}
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  )
}

// Donut Chart Component
interface DonutChartData {
  name: string
  value: number
  color?: string
}

interface DonutChartCardProps {
  data: DonutChartData[]
  title?: string
  height?: number
  formatter?: (value: any) => string
  showLegendValues?: boolean
}

export const DonutChartCard = ({
  data,
  title,
  height = 300,
  formatter,
  showLegendValues = false,
}: DonutChartCardProps) => {
  const renderCustomLegend = (props: any) => {
    const { payload } = props
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
        {payload.map((entry: any, index: number) => (
          <Box
            key={`legend-${index}`}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: entry.color,
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {entry.value}
              </Typography>
            </Box>
            {showLegendValues && (
              <Typography variant="caption" fontWeight="medium">
                {formatter ? formatter(entry.payload.value) : entry.payload.value}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    )
  }

  return (
    <Paper sx={{ p: 3, border: 1, borderColor: 'divider' }}>
      {title && (
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          {title}
        </Typography>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || CHART_PALETTE[index % CHART_PALETTE.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip formatter={formatter} />} />
          {showLegendValues ? (
            <Legend content={renderCustomLegend} />
          ) : (
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '12px' }}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </Paper>
  )
}

// Line Chart Component
interface LineChartCardProps {
  data: any[]
  dataKeys: string[]
  xAxisKey: string
  title?: string
  colors?: string[]
  height?: number
  formatter?: (value: any) => string
}

export const LineChartCard = ({
  data,
  dataKeys,
  xAxisKey,
  title,
  colors = CHART_PALETTE,
  height = 300,
  formatter,
}: LineChartCardProps) => {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  return (
    <Paper sx={{ p: 3, border: 1, borderColor: 'divider' }}>
      {title && (
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          {title}
        </Typography>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
          />
          <XAxis
            dataKey={xAxisKey}
            stroke={theme.palette.text.secondary}
            style={{ fontSize: '12px' }}
          />
          <YAxis stroke={theme.palette.text.secondary} style={{ fontSize: '12px' }} />
          <Tooltip content={<CustomTooltip formatter={formatter} />} />
          <Legend
            verticalAlign="top"
            height={36}
            iconType="line"
            wrapperStyle={{ fontSize: '12px' }}
          />
          {dataKeys.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={{ fill: colors[index % colors.length], r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Paper>
  )
}
