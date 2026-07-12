import React from 'react';
import {
  Paper,
  TableContainer,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import type { Column } from './DataTable';
import { VirtualList } from '../performance/VirtualList';

interface VirtualDataTableProps {
  columns: Column[];
  data: any[];
  loading?: boolean;
  rowHeight?: number;
  containerHeight?: number;
  onRowClick?: (row: any) => void;
  emptyMessage?: string;
}

/**
 * VirtualDataTable Component
 * 
 * High-performance table for large datasets using virtual scrolling.
 * Only renders visible rows for optimal performance.
 * 
 * @example
 * ```tsx
 * <VirtualDataTable
 *   columns={columns}
 *   data={orders}
 *   rowHeight={60}
 *   containerHeight={700}
 * />
 * ```
 */
const VirtualDataTable: React.FC<VirtualDataTableProps> = ({
  columns,
  data,
  loading = false,
  rowHeight = 60,
  containerHeight = 600,
  onRowClick,
  emptyMessage = 'No data available',
}) => {
  const renderRow = (row: any, index: number) => (
    <Box
      style={{
        display: 'flex',
        borderBottom: '1px solid #e0e0e0',
        cursor: onRowClick ? 'pointer' : 'default',
        backgroundColor: index % 2 === 0 ? '#fff' : '#fafafa',
      }}
      onClick={() => onRowClick?.(row)}
      sx={{
        '&:hover': {
          backgroundColor: onRowClick ? '#f5f5f5' : undefined,
        },
      }}
    >
      {columns.map((column) => (
        <Box
          key={column.id}
          sx={{
            flex: 1,
            padding: 2,
            display: 'flex',
            alignItems: 'center',
            minWidth: column.minWidth || 100,
            textAlign: column.align || 'left',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {column.format 
            ? column.format(row[column.id]) 
            : row[column.id]
          }
        </Box>
      ))}
    </Box>
  );

  if (loading) {
    return (
      <TableContainer component={Paper}>
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress />
        </Box>
      </TableContainer>
    );
  }

  return (
    <TableContainer component={Paper}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          backgroundColor: '#f5f5f5',
          fontWeight: 'bold',
          borderBottom: '2px solid #ddd',
          position: 'sticky',
          top: 0,
          zIndex: 1,
        }}
      >
        {columns.map((column) => (
          <Box
            key={column.id}
            sx={{
              flex: 1,
              padding: 2,
              minWidth: column.minWidth || 100,
              textAlign: column.align || 'left',
            }}
          >
            {column.label}
          </Box>
        ))}
      </Box>

      {/* Virtual List */}
      {data.length > 0 ? (
        <VirtualList
          items={data}
          height={containerHeight}
          itemHeight={rowHeight}
          renderItem={renderRow}
        />
      ) : (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="textSecondary">
            {emptyMessage}
          </Typography>
        </Box>
      )}
    </TableContainer>
  );
};

export default VirtualDataTable;
