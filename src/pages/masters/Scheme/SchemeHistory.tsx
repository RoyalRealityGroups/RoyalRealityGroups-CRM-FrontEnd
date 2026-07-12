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
  Stack,
} from '@mui/material';
import {
  Search as SearchIcon,
  History as HistoryIcon,
  Close as CloseIcon,
  Create as CreateIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CardGiftcard as SchemeIcon,
} from '@mui/icons-material';
import HomeIcon from '@mui/icons-material/Home';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { usePageTitle } from '../../../hooks';
import ScreenHeader from '../../../components/common/ScreenHeader';
import apiClient from '../../../api/axios.config';
import { API_ENDPOINTS } from '../../../utils/constants';
import {
  getPageContainerStyles,
  getHeaderSectionStyles,
  getContentSectionStyles,
} from '../../../utils/spacing';
import { format } from 'date-fns';

type SchemeAction = 'CREATE' | 'UPDATE' | 'DELETE';

interface SchemeHistoryRecord {
  id: string;
  scheme_id: string;
  scheme_code: string;
  scheme_name: string;
  action: SchemeAction;
  action_display: string;
  change_summary: string;
  changes: Record<string, { old: any; new: any }>;
  created_on: string;
  created_by_name?: string;
  status?: string;
  scheme_type_display?: string;
  effective_from?: string;
  effective_to?: string;
}

const SchemeHistory: React.FC = () => {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbs();
  const [searchParams] = useSearchParams();

  const [searchInput, setSearchInput] = useState('');
  const [actionFilter, setActionFilter] = useState<SchemeAction | ''>('');
  const schemeId = searchParams.get('scheme_id');

  usePageTitle('Scheme History');

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Schemes', path: '/scheme', icon: <SchemeIcon fontSize="small" /> },
      { label: 'History', icon: <HistoryIcon fontSize="small" /> },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  const { data, isLoading } = useQuery({
    queryKey: ['schemeHistory', schemeId, searchInput, actionFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (schemeId) params.scheme_id = schemeId;
      if (searchInput) params.search = searchInput;
      if (actionFilter) params.action = actionFilter;
      const response = await apiClient.get(API_ENDPOINTS.SCHEMES_HISTORY, { params });
      return response.data;
    },
  });

  const results: SchemeHistoryRecord[] = data?.results || (Array.isArray(data) ? data : []);
  const totalCount = data?.count ?? results.length;

  const handleBack = () => {
    const returnTab = searchParams.get('returnTab');
    const returnPage = searchParams.get('returnPage');
    const returnPageSize = searchParams.get('returnPageSize');

    if (returnTab !== null) {
      navigate('/scheme', {
        state: {
          activeTab: parseInt(returnTab),
          page: returnPage ? parseInt(returnPage) : 0,
          pageSize: returnPageSize ? parseInt(returnPageSize) : 10,
        },
      });
    } else {
      navigate('/scheme');
    }
  };

  const getActionIcon = (action: SchemeAction) => {
    switch (action) {
      case 'CREATE': return <CreateIcon fontSize="small" />;
      case 'UPDATE': return <EditIcon fontSize="small" />;
      case 'DELETE': return <DeleteIcon fontSize="small" />;
      default: return <HistoryIcon fontSize="small" />;
    }
  };

  const getActionColor = (action: SchemeAction): 'success' | 'info' | 'error' | 'default' => {
    switch (action) {
      case 'CREATE': return 'success';
      case 'UPDATE': return 'info';
      case 'DELETE': return 'error';
      default: return 'default';
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      return format(new Date(dateStr), 'dd MMM yyyy');
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      return format(new Date(dateStr), 'dd MMM yyyy, HH:mm:ss');
    } catch {
      return dateStr;
    }
  };

  return (
    <Box sx={getPageContainerStyles()}>
      {/* Header */}
      <Box sx={getHeaderSectionStyles()}>
        <ScreenHeader
          title="Scheme History"
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
              placeholder="Search by scheme code or name..."
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
              onChange={(e) => setActionFilter(e.target.value as SchemeAction | '')}
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
        ) : results.length === 0 ? (
          <Paper elevation={0} sx={{ p: 4, textAlign: 'center' }}>
            <HistoryIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No history records found
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {results.map((record, index) => (
              <Card
                key={record.id || `${record.created_on}-${record.action}-${index}`}
                elevation={0}
                sx={{ border: 1, borderColor: 'divider' }}
              >
                <CardContent>
                  {/* Action & Timestamp */}
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Chip
                      icon={getActionIcon(record.action)}
                      label={record.action_display || record.action}
                      color={getActionColor(record.action)}
                      size="small"
                    />
                    <Typography variant="body2" color="text.secondary">
                      {formatDateTime(record.created_on)}
                    </Typography>
                    {record.created_by_name && (
                      <Typography variant="body2" color="text.secondary">
                        by {record.created_by_name}
                      </Typography>
                    )}
                  </Box>

                  {/* Scheme Info */}
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
                      gap: 2,
                      mb: 2,
                      p: 2,
                      bgcolor: 'primary.light',
                      borderRadius: 1,
                    }}
                  >
                    {record.scheme_code && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight="bold">
                          Scheme Code
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {record.scheme_code}
                        </Typography>
                      </Box>
                    )}
                    {record.scheme_name && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight="bold">
                          Scheme Name
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {record.scheme_name}
                        </Typography>
                      </Box>
                    )}
                    {record.scheme_type_display && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight="bold">
                          Scheme Type
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {record.scheme_type_display}
                        </Typography>
                      </Box>
                    )}
                    {record.status && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight="bold">
                          Status
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {record.status}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Change Summary */}
                  {record.change_summary && (
                    <Typography variant="body1" gutterBottom>
                      {record.change_summary}
                    </Typography>
                  )}

                  {/* Effective Dates */}
                  {(record.effective_from || record.effective_to) && (
                    <Box mt={2} p={2} bgcolor="grey.50" borderRadius={1}>
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">
                        Effective Period
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 0.5 }}>
                        {record.effective_from && (
                          <Box>
                            <Typography variant="body2" color="text.secondary">From</Typography>
                            <Typography variant="body2">{formatDate(record.effective_from)}</Typography>
                          </Box>
                        )}
                        {record.effective_to && (
                          <Box>
                            <Typography variant="body2" color="text.secondary">To</Typography>
                            <Typography variant="body2">{formatDate(record.effective_to)}</Typography>
                          </Box>
                        )}
                      </Box>
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
                                label={String(change.old ?? 'None')}
                                size="small"
                                variant="outlined"
                                color="error"
                              />
                              <Typography variant="body2" color="text.secondary">→</Typography>
                              <Chip
                                label={String(change.new ?? 'None')}
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

        {/* Record count */}
        {totalCount > 0 && (
          <Box mt={2} textAlign="center">
            <Typography variant="body2" color="text.secondary">
              Showing {results.length} of {totalCount} records
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default SchemeHistory;
