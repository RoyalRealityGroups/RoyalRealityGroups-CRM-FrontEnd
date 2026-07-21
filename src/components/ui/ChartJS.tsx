/**
 * Chart.js Components with Animations
 *
 * Professional chart wrappers using Chart.js + react-chartjs-2
 * Features:
 *   - Pie/Donut with smooth rotation animation
 *   - Bar chart with progressive delay animation
 *   - Line chart with progressive drawing animation
 *
 * References:
 *   - https://www.chartjs.org/docs/latest/samples/other-charts/pie.html
 *   - https://www.chartjs.org/docs/latest/samples/animations/loop.html
 *   - https://www.chartjs.org/docs/latest/samples/animations/progressive-line.html
 */
import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
  type ChartData,
} from 'chart.js';
import { Pie, Doughnut, Bar, Line } from 'react-chartjs-2';
import { Box, Typography, Paper } from '@mui/material';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Brand palette
export const CHARTJS_PALETTE = [
  '#1976d2',
  '#7b1fa2',
  '#388e3c',
  '#f57c00',
  '#00838f',
  '#c62828',
  '#0288d1',
  '#5e35b1',
  '#2e7d32',
  '#ef6c00',
];

// =============================================================================
// PIE CHART — with rotation animation
// =============================================================================
interface PieChartCardProps {
  data: { name: string; value: number; color?: string }[];
  title?: string;
  height?: number;
  donut?: boolean;
}

export const PieChartCard: React.FC<PieChartCardProps> = ({
  data,
  title,
  height = 300,
  donut = false,
}) => {
  const chartData: ChartData<'pie' | 'doughnut'> = {
    labels: data.map((d) => d.name),
    datasets: [
      {
        data: data.map((d) => d.value),
        backgroundColor: data.map((d, i) => d.color || CHARTJS_PALETTE[i % CHARTJS_PALETTE.length]),
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const options: ChartOptions<'pie' | 'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1200,
      easing: 'easeOutQuart',
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: { size: 13 },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => {
            const total = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0);
            const value = ctx.parsed;
            const percentage = ((value / total) * 100).toFixed(1);
            return ` ${ctx.label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  const ChartComponent = donut ? Doughnut : Pie;

  return (
    <Paper sx={{ p: 3, border: 1, borderColor: 'divider', height: '100%' }}>
      {title && (
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          {title}
        </Typography>
      )}
      <Box sx={{ height, position: 'relative' }}>
        <ChartComponent data={chartData as any} options={options as any} />
      </Box>
    </Paper>
  );
};

// =============================================================================
// BAR CHART — with progressive delay animation
// =============================================================================
interface BarChartCardProps {
  data: any[];
  dataKeys: string[];
  xAxisKey: string;
  title?: string;
  colors?: string[];
  height?: number;
  horizontal?: boolean;
}

export const AnimatedBarChartCard: React.FC<BarChartCardProps> = ({
  data,
  dataKeys,
  xAxisKey,
  title,
  colors = CHARTJS_PALETTE,
  height = 300,
  horizontal = false,
}) => {
  const labels = data.map((d) => d[xAxisKey]);

  const chartData: ChartData<'bar'> = {
    labels,
    datasets: dataKeys.map((key, index) => ({
      label: key,
      data: data.map((d) => d[key] || 0),
      backgroundColor: colors[index % colors.length] + 'CC', // slightly transparent
      borderColor: colors[index % colors.length],
      borderWidth: 1,
      borderRadius: 4,
      borderSkipped: false,
    })),
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: horizontal ? 'y' : 'x',
    animation: {
      duration: 1000,
      easing: 'easeOutQuart',
      delay: (context) => {
        let delay = 0;
        if (context.type === 'data' && context.mode === 'default') {
          delay = context.dataIndex * 100 + context.datasetIndex * 50;
        }
        return delay;
      },
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          padding: 16,
          usePointStyle: true,
          pointStyle: 'rectRounded',
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: { size: 13 },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.06)' },
        ticks: { font: { size: 11 } },
      },
    },
  };

  return (
    <Paper sx={{ p: 3, border: 1, borderColor: 'divider', height: '100%' }}>
      {title && (
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          {title}
        </Typography>
      )}
      <Box sx={{ height, position: 'relative' }}>
        <Bar data={chartData} options={options} />
      </Box>
    </Paper>
  );
};

// =============================================================================
// LINE CHART — with progressive drawing animation
// =============================================================================
interface LineChartCardProps {
  data: any[];
  dataKeys: string[];
  xAxisKey: string;
  title?: string;
  colors?: string[];
  height?: number;
  fill?: boolean;
}

export const AnimatedLineChartCard: React.FC<LineChartCardProps> = ({
  data,
  dataKeys,
  xAxisKey,
  title,
  colors = CHARTJS_PALETTE,
  height = 300,
  fill = true,
}) => {
  const labels = data.map((d) => d[xAxisKey]);
  const totalPoints = data.length;

  const chartData: ChartData<'line'> = {
    labels,
    datasets: dataKeys.map((key, index) => ({
      label: key,
      data: data.map((d) => d[key] || 0),
      borderColor: colors[index % colors.length],
      backgroundColor: fill
        ? colors[index % colors.length] + '20'
        : 'transparent',
      fill: fill,
      tension: 0.4,
      borderWidth: 2.5,
      pointRadius: 4,
      pointHoverRadius: 7,
      pointBackgroundColor: colors[index % colors.length],
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
    })),
  };

  // Progressive line animation — draws each point sequentially
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1500,
      easing: 'easeInOutQuart',
      // Progressive reveal: each point is delayed
      delay: (context) => {
        if (context.type === 'data' && context.mode === 'default') {
          return context.dataIndex * (1500 / totalPoints) + context.datasetIndex * 200;
        }
        return 0;
      },
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: { size: 13 },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.06)' },
        ticks: { font: { size: 11 } },
      },
    },
  };

  return (
    <Paper sx={{ p: 3, border: 1, borderColor: 'divider', height: '100%' }}>
      {title && (
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          {title}
        </Typography>
      )}
      <Box sx={{ height, position: 'relative' }}>
        <Line data={chartData} options={options} />
      </Box>
    </Paper>
  );
};
