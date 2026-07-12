import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  InputAdornment,
  MenuItem,
  Typography,
  Chip,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Stack,
} from '@mui/material';
import {
  Search as SearchIcon,
  History as HistoryIcon,
  Close as CloseIcon,
  Create as CreateIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { priceBookApi } from '../../../api/masters.api';
import ScreenHeader from '../../../components/common/ScreenHeader';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import HomeIcon from '@mui/icons-material/Home';
import FolderIcon from '@mui/icons-material/Folder';
import type { PriceBookAction } from '../../../types/masters.types';
import {

  getPageContainerStyles,
  getHeaderSectionStyles,
  getContentSectionStyles,
} from '../../../utils/spacing';
import { format } from 'date-fns';

const PriceBookHistory: React.FC = () => {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbs();
  const [searchParams] = useSearchParams();

  const [searchInput, setSearchInput] = useState('');
  const [actionFilter, setActionFilter] = useState<PriceBookAction | ''>('');
  const priceBookId = searchParams.get('price_book_id');

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      // { label: 'Masters', path: '/masters', icon: <FolderIcon fontSize="small" /> },
      { label: 'Price Book', path: '/price-book', icon: <HistoryIcon fontSize="small" /> },
      { label: 'History', icon: <HistoryIcon fontSize="small" /> },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  const { data, isLoading } = useQuery({
    queryKey: ['priceBookHistory', priceBookId, searchInput, actionFilter],
    queryFn: () => priceBookApi.getPriceHistory({
      price_book_id: priceBookId || undefined,
      item_code: searchInput || undefined,
      action: actionFilter || undefined,
    }),
  });

  const handleBack = () => {
    const returnTab = searchParams.get('returnTab');
    const returnPage = searchParams.get('returnPage');
    const returnPageSize = searchParams.get('returnPageSize');
    
    if (returnTab !== null) {
      navigate('/price-book', {
        state: {
          activeTab: parseInt(returnTab),
          page: returnPage ? parseInt(returnPage) : 0,
          pageSize: returnPageSize ? parseInt(returnPageSize) : 10,
        },
      });
    } else {
      navigate('/price-book');
    }
  };

  const getActionIcon = (action: PriceBookAction) => {
    switch (action) {
      case 'CREATE':
        return <CreateIcon fontSize="small" />;
      case 'UPDATE':
        return <EditIcon fontSize="small" />;
      case 'DELETE':
        return <DeleteIcon fontSize="small" />;
      default:
        return <HistoryIcon fontSize="small" />;
    }
  };

  const getActionColor = (action: PriceBookAction) => {
    switch (action) {
      case 'CREATE':
        return 'success';
      case 'UPDATE':
        return 'info';
      case 'DELETE':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={getPageContainerStyles()}>
      {/* Header */}
      <Box sx={getHeaderSectionStyles()}>
        <ScreenHeader
          title="Price Book History"
          showBackButton
          onBack={handleBack}
          disableBox
        />
      </Box>

      {/* Content */}
      <Box sx={getContentSectionStyles()}>
        {/* Filters */}
        <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 2 }}>
            <TextField
              placeholder="Search by item code..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              size="small"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchInput && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchInput('')}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              select
              fullWidth
              label="Action"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value as PriceBookAction | '')}
              size="small"
            >
              <MenuItem value="">All Actions</MenuItem>
              <MenuItem value="CREATE">Create</MenuItem>
              <MenuItem value="UPDATE">Update</MenuItem>
              <MenuItem value="DELETE">Delete</MenuItem>
            </TextField>
          </Box>
        </Paper>

        {/* History Timeline */}
        {isLoading ? (
          <Paper elevation={0} sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">Loading history...</Typography>
          </Paper>
        ) : !data?.results || data.results.length === 0 ? (
          <Paper elevation={0} sx={{ p: 4, textAlign: 'center' }}>
            <HistoryIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No history records found
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {data.results.map((record, index) => (
              <Card key={`${record.created_on}-${record.action}-${index}`} elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Chip
                      icon={getActionIcon(record.action)}
                      label={record.action_display}
                      color={getActionColor(record.action)}
                      size="small"
                    />
                    <Typography variant="body2" color="text.secondary">
                      {format(new Date(record.created_on), 'dd MMM yyyy, HH:mm:ss')}
                    </Typography>
                  </Box>

                  {/* Document and Item Info */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 2, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                    {record.document_number && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight="bold">
                          Document No
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {record.document_number}
                        </Typography>
                      </Box>
                    )}
                    {record.document_date && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight="bold">
                          Document Date
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {format(new Date(record.document_date), 'dd MMM yyyy')}
                        </Typography>
                      </Box>
                    )}
                    {record.price_book_code && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight="bold">
                          Price Book Code
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {record.price_book_code}
                        </Typography>
                      </Box>
                    )}
                    {record.price_book_item && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight="bold">
                          Item
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {record.price_book_item}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Change Summary */}
                  <Typography variant="body1" gutterBottom>
                    {record.change_summary}
                  </Typography>

                  {/* Price Snapshot */}
                  {(record.base_price || record.selling_price || record.mrp) && (
                    <Box mt={2} p={2} bgcolor="grey.50" borderRadius={1}>
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">
                        Price Snapshot
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mt: 0.5 }}>
                        {record.base_price && (
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Base Price
                            </Typography>
                            <Typography variant="body1" fontWeight="medium">
                              ₹{parseFloat(record.base_price).toFixed(2)}
                            </Typography>
                          </Box>
                        )}
                        {record.selling_price && (
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Selling Price
                            </Typography>
                            <Typography variant="body1" fontWeight="medium">
                              ₹{parseFloat(record.selling_price).toFixed(2)}
                            </Typography>
                          </Box>
                        )}
                        {record.mrp && (
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              MRP
                            </Typography>
                            <Typography variant="body1" fontWeight="medium">
                              ₹{parseFloat(record.mrp).toFixed(2)}
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {(record.effective_from || record.effective_to) && (
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
                          {record.effective_from && (
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Effective From
                              </Typography>
                              <Typography variant="body2">
                                {format(new Date(record.effective_from), 'dd MMM yyyy')}
                              </Typography>
                            </Box>
                          )}
                          {record.effective_to && (
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Effective To
                              </Typography>
                              <Typography variant="body2">
                                {format(new Date(record.effective_to), 'dd MMM yyyy')}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      )}
                    </Box>
                  )}

                  {/* Detailed Changes */}
                  {record.changes && Object.keys(record.changes).length > 0 && (
                    <Box mt={2}>
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">
                        Detailed Changes
                      </Typography>
                      <Box mt={1}>
                        {Object.entries(record.changes).map(([field, change]) => (
                          <Box
                            key={field}
                            display="flex"
                            alignItems="center"
                            gap={1}
                            py={0.5}
                            borderBottom={1}
                            borderColor="divider"
                          >
                            <Typography variant="body2" fontWeight="medium" minWidth={120}>
                              {field.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}:
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1} flex={1}>
                              <Chip
                                label={String(change.old) || 'None'}
                                size="small"
                                variant="outlined"
                                color="error"
                              />
                              <Typography variant="body2" color="text.secondary">
                                →
                              </Typography>
                              <Chip
                                label={String(change.new) || 'None'}
                                size="small"
                                variant="outlined"
                                color="success"
                              />
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}

        {/* Pagination info */}
        {data && data.count > 0 && (
          <Box mt={2} textAlign="center">
            <Typography variant="body2" color="text.secondary">
              Showing {data.results.length} of {data.count} records
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default PriceBookHistory;
