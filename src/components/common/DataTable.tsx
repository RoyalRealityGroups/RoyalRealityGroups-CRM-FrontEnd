import React, { memo, useMemo, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  CircularProgress,
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  useMediaQuery,
  useTheme,
  Divider,
} from '@mui/material';

export interface Column {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'left' | 'center' | 'right';
  format?: (value: any) => string;
  hideOnMobile?: boolean;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  loading?: boolean;
  page?: number;
  rowsPerPage?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
  onRowClick?: (row: any) => void;
}

const DataTable: React.FC<DataTableProps> = memo(({
  columns,
  data,
  loading = false,
  page = 0,
  rowsPerPage = 20,
  totalCount = 0,
  onPageChange,
  onRowsPerPageChange,
  onRowClick,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleChangePage = useCallback((_: unknown, newPage: number) => {
    onPageChange?.(newPage);
  }, [onPageChange]);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    onRowsPerPageChange?.(parseInt(event.target.value, 10));
  }, [onRowsPerPageChange]);

  // Filter columns for mobile
  const visibleColumns = useMemo(() => 
    isMobile ? columns.filter(col => !col.hideOnMobile) : columns,
    [isMobile, columns]
  );

  // Mobile Card View
  if (isMobile) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 1 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={40} />
            </Box>
          ) : data.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="textSecondary">
                No data available
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1}>
              {data.map((row, index) => (
                <Box key={row.id || index} sx={{ width: '100%' }}>
                  <Card 
                    onClick={() => onRowClick?.(row)}
                    sx={{ 
                      cursor: onRowClick ? 'pointer' : 'default',
                      '&:active': {
                        transform: 'scale(0.98)',
                      },
                      transition: 'transform 0.1s',
                    }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      {visibleColumns.map((column, idx) => {
                        const value = row[column.id];
                        return (
                          <Box key={column.id}>
                            <Box 
                              sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                mb: idx < visibleColumns.length - 1 ? 1 : 0,
                              }}
                            >
                              <Typography 
                                variant="caption" 
                                color="textSecondary"
                                sx={{ fontWeight: 600, mr: 1 }}
                              >
                                {column.label}:
                              </Typography>
                              <Typography 
                                variant="body2"
                                sx={{ 
                                  textAlign: 'right',
                                  wordBreak: 'break-word',
                                  flex: 1,
                                }}
                              >
                                {column.format ? column.format(value) : value || '-'}
                              </Typography>
                            </Box>
                            {idx < visibleColumns.length - 1 && <Divider sx={{ my: 0.5 }} />}
                          </Box>
                        );
                      })}
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Stack>
          )}
        </Box>

        {onPageChange && (
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={isSmallMobile ? [10, 20] : [10, 20, 50]}
            labelRowsPerPage={isSmallMobile ? 'Rows:' : 'Rows per page:'}
            sx={{
              '.MuiTablePagination-toolbar': {
                minHeight: { xs: '48px', sm: '52px' },
              },
              '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
              },
            }}
          />
        )}
      </Box>
    );
  }

  // Desktop Table View
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TableContainer 
        component={Paper} 
        sx={{ 
          flexGrow: 1, 
          overflow: 'auto',
          maxHeight: 'calc(100vh - 250px)',
        }}
      >
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth, fontWeight: 600 }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center">
                  <CircularProgress size={40} />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center">
                  <Typography variant="body2" color="textSecondary">
                    No data available
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => (
                <TableRow
                  hover
                  key={row.id || index}
                  onClick={() => onRowClick?.(row)}
                  sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {columns.map((column) => {
                    const value = row[column.id];
                    return (
                      <TableCell key={column.id} align={column.align}>
                        {column.format ? column.format(value) : value}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {onPageChange && (
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 20, 50, 100]}
        />
      )}
    </Box>
  );
});

DataTable.displayName = 'DataTable';

export default DataTable;
