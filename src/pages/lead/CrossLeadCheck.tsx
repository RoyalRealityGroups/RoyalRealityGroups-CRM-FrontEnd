import React, { useState } from 'react';
import {
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  Typography,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Card,
  CardContent,
} from '@mui/material';
import { Search as SearchIcon, Person as PersonIcon, Home as HomeIcon } from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { leadApi } from '../../api/lead.api';
import ScreenHeader from '../../components/common/ScreenHeader';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks';
import type { CrossCheckResult } from '../../types/lead.types';
import { getPageContainerStyles, getContentSectionStyles } from '../../utils/spacing';

const CrossLeadCheck: React.FC = () => {
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();
  usePageTitle('Cross Lead Check');

  const [searchData, setSearchData] = useState({
    mobile: '',
    alternate_number: '',
    email: '',
  });

  const [result, setResult] = useState<CrossCheckResult | null>(null);

  const crossCheckMutation = useMutation({
    mutationFn: (data: { mobile?: string; alternate_number?: string; email?: string }) =>
      leadApi.crossCheck(data),
    onSuccess: (data) => {
      setResult(data);
      if (!data.has_duplicates) {
        toastSuccess('No duplicates found');
      }
    },
    onError: (error: any) => {
      toastError(error.response?.data?.message || 'Cross check failed');
    },
  });

  React.useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Lead Management', path: '/lead', icon: <PersonIcon fontSize="small" /> },
      { label: 'Cross Lead Check', path: '/lead/cross-check', icon: <SearchIcon fontSize="small" /> },
    ]);
  }, [setBreadcrumbs]);

  const handleChange = (field: keyof typeof searchData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchData.mobile && !searchData.alternate_number && !searchData.email) {
      toastError('Please enter at least one field to search');
      return;
    }
    crossCheckMutation.mutate(searchData);
  };

  const handleClear = () => {
    setSearchData({ mobile: '', alternate_number: '', email: '' });
    setResult(null);
  };

  return (
    <Box sx={getPageContainerStyles()}>
      <ScreenHeader
        title="Cross Lead Check"
        
        showAddButton={false}
      />

      <Paper sx={{ ...getContentSectionStyles(), mb: 3 }}>
        <form onSubmit={handleSearch}>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Mobile Number"
                value={searchData.mobile}
                onChange={handleChange('mobile')}
                InputProps={{
                  startAdornment: <Box sx={{ mr: 1 }}>+91</Box>,
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Alternate Number"
                value={searchData.alternate_number}
                onChange={handleChange('alternate_number')}
                InputProps={{
                  startAdornment: <Box sx={{ mr: 1 }}>+91</Box>,
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={searchData.email}
                onChange={handleChange('email')}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SearchIcon />}
                  disabled={crossCheckMutation.isPending}
                >
                  {crossCheckMutation.isPending ? 'Searching...' : 'Search'}
                </Button>
                <Button variant="outlined" onClick={handleClear}>
                  Clear
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {result && (
        <>
          {result.has_duplicates ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Found {result.duplicates.length} duplicate lead(s) with similar details
            </Alert>
          ) : (
            <Alert severity="success" sx={{ mb: 2 }}>
              No duplicates found in the system
            </Alert>
          )}

          {result.has_duplicates && (
            <Paper sx={getContentSectionStyles()}>
              <Typography variant="h6" gutterBottom>
                Matching Leads
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Lead Code</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Matched Field</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Assigned To</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {result.duplicates.map((dup, index) => (
                      <TableRow key={index}>
                        <TableCell>{dup.lead.code}</TableCell>
                        <TableCell>{dup.lead.name}</TableCell>
                        <TableCell>
                          <Chip
                            label={dup.match_field.replace('_', ' ')}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          <Typography variant="caption" display="block" color="text.secondary">
                            {dup.match_value}
                          </Typography>
                        </TableCell>
                        <TableCell>{dup.lead.status}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon fontSize="small" color="action" />
                            {dup.lead.assigned_employee?.name || 'Unassigned'}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <CardContent>
                  <Typography variant="h6">Search Tips</Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    • Enter a mobile number to find leads with the same contact
                    <br />
                    • Use email to check for leads with the same email address
                    <br />
                    • The system checks against active leads (New to Interested status)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default CrossLeadCheck;
