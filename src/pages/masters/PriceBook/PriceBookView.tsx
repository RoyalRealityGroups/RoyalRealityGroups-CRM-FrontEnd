import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PrintIcon from '@mui/icons-material/Print';
import EditIcon from '@mui/icons-material/Edit';
import HomeIcon from '@mui/icons-material/Home';
import FolderIcon from '@mui/icons-material/Folder';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { format } from 'date-fns';
import { priceBookDocumentApi, stateApi, cityApi, areaApi } from '../../../api/masters.api';
import { useToast } from '../../../contexts/ToastContext';
import { usePageTitle } from '../../../hooks';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import ScreenHeader from '../../../components/common/ScreenHeader';
import AuthorizationHistory from '../../../components/authorization/AuthorizationHistory';
import { getPageContainerStyles, getHeaderSectionStyles } from '../../../utils/spacing';
import type { RootState } from '../../../store/store';
import { hasPermission } from '../../../utils/permissions';

interface FilterNames {
  stateName?: string;
  cityName?: string;
  areaName?: string;
}

const PriceBookView: React.FC = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const [searchParams] = useSearchParams();
  const documentId = searchParams.get('documentId');
  const { error: toastError } = useToast();
  const { setBreadcrumbs } = useBreadcrumbs();

  const [loading, setLoading] = useState(true);
  const [document, setDocument] = useState<any>(null);
  const [priceEntries, setPriceEntries] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filterNames, setFilterNames] = useState<FilterNames>({});

  usePageTitle('Price Book View');

  useEffect(() => {
    if (document) {
      setBreadcrumbs([
        { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
        // { label: 'Masters', path: '/masters', icon: <FolderIcon fontSize="small" /> },
        { label: 'Price Book', path: '/price-book', icon: <LibraryBooksIcon fontSize="small" /> },
        { label: 'View', icon: <VisibilityIcon fontSize="small" /> },
      ]);
    }
    return () => setBreadcrumbs([]);
  }, [document, setBreadcrumbs]);

  useEffect(() => {
    if (!documentId) {
      setError('No document ID provided');
      setLoading(false);
      return;
    }
    loadDocumentData();
  }, [documentId]);

  const loadDocumentData = async () => {
    try {
      setLoading(true);
      const data = await priceBookDocumentApi.getDocument(documentId!);
      setDocument(data);
      setPriceEntries(data.price_entries || []);

      const names: FilterNames = {};
      if (data.cp_filter_state) {
        try { names.stateName = (await stateApi.getState(data.cp_filter_state)).name; } catch {}
      }
      if (data.cp_filter_city) {
        try { names.cityName = (await cityApi.getCity(data.cp_filter_city)).name; } catch {}
      }
      if (data.cp_filter_area) {
        try { names.areaName = (await areaApi.getArea(data.cp_filter_area)).name; } catch {}
      }
      setFilterNames(names);
    } catch (err: any) {
      setError(err.message || 'Failed to load document');
      toastError('Failed to load price book document');
    } finally {
      setLoading(false);
    }
  };

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

  const handlePrint = () => {
    if (!documentId) return;
    navigate(`/price-book/print?documentId=${documentId}`);
  };

  const handleEdit = () => {
    if (!documentId) return;
    navigate(`/price-book/manage?documentId=${documentId}`);
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, any> = {
      DRAFT: { bg: '#fff3cd', color: '#856404', label: 'Draft' },
      ACTIVE: { bg: '#d4edda', color: '#155724', label: 'Active' },
      CLOSED: { bg: '#d1ecf1', color: '#0c5460', label: 'Closed' },
    };
    return configs[status] || configs.ACTIVE;
  };

  const getLocationLabel = (entry: any, locationType: string): string => {
    switch (locationType) {
      case 'BASE': return 'All Locations';
      case 'STATE': return entry.state_name || entry.state || '-';
      case 'CITY': return entry.city_name || entry.city || '-';
      case 'AREA': return entry.area_name || entry.area || '-';
      case 'SUPERSTOCKIST': return entry.superstockist_name || entry.superstockist || '-';
      case 'DISTRIBUTOR': return entry.distributor_name || entry.distributor || '-';
      case 'RETAILER': return entry.retailer_name || entry.retailer || '-';
      default: return '-';
    }
  };

  const getLocationId = (entry: any, locationType: string): string => {
    switch (locationType) {
      case 'STATE': return entry.state || '';
      case 'CITY': return entry.city || '';
      case 'AREA': return entry.area || '';
      case 'SUPERSTOCKIST': return entry.superstockist || '';
      case 'DISTRIBUTOR': return entry.distributor || '';
      case 'RETAILER': return entry.retailer || '';
      default: return 'base';
    }
  };

  const buildPriceGrid = () => {
    if (!document) return { items: [], locations: [], priceMatrix: {} as Record<string, string> };

    const itemsMap = new Map<string, { id: string; code: string; name: string }>();
    const locationsMap = new Map<string, { id: string; name: string }>();
    const priceMatrix: Record<string, string> = {};

    priceEntries.forEach(entry => {
      const itemId = entry.item || entry.item_id;
      if (!itemsMap.has(itemId)) {
        itemsMap.set(itemId, { id: itemId, code: entry.item_code || '', name: entry.item_name || '' });
      }
      const locationId = getLocationId(entry, document.location_type);
      const locationName = getLocationLabel(entry, document.location_type);
      if (!locationsMap.has(locationId)) {
        locationsMap.set(locationId, { id: locationId, name: locationName });
      }
      priceMatrix[`${itemId}-${locationId}`] = entry.selling_price || '0';
    });

    return {
      items: Array.from(itemsMap.values()),
      locations: Array.from(locationsMap.values()),
      priceMatrix,
    };
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !document) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error || 'Failed to load document'}</Alert>
        <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={handleBack}>
          Back to List
        </Button>
      </Box>
    );
  }

  const statusConfig = getStatusConfig(document.status);
  const canPrint = hasPermission(user, 'print_pricebook');
  const canEdit = hasPermission(user, 'change_pricebook');

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: '#f5f5f5',
        overflow: 'auto',
      }}
    >
      <Box sx={getHeaderSectionStyles()}>
        <ScreenHeader
          title={`Price Book - ${document.document_number}`}
          showBackButton
          onBack={handleBack}
          disableBox
        >
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            {canEdit && document.status === 'DRAFT' && (
              <Button variant="outlined" startIcon={<EditIcon />} onClick={handleEdit}>
                Edit
              </Button>
            )}
            {canPrint && (
              <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint}>
                Print
              </Button>
            )}
          </Box>
        </ScreenHeader>
      </Box>

      <Paper sx={{ maxWidth: 1200, mx: 'auto', p: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, color: '#006766', mb: 1, fontFamily: '"Space Grotesk", "Poppins", sans-serif' }}
              >
                Price Book Document
              </Typography>
            </Box>
            <Chip
              label={statusConfig.label}
              sx={{
                backgroundColor: statusConfig.bg,
                color: statusConfig.color,
                fontWeight: 700,
                fontSize: '1rem',
                height: 40,
                px: 2,
              }}
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h5" sx={{ fontWeight: 600, color: '#006766', textAlign: 'center', mb: 3 }}>
            PRICE BOOK
          </Typography>
        </Box>

        {/* Document Details */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 3 }}>
            Document Details
          </Typography>
          <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0' }}>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', width: '15%', border: '1px solid #e0e0e0' }}>
                    Document Number
                  </TableCell>
                  <TableCell sx={{ width: '20%', border: '1px solid #e0e0e0' }}>
                    {document.document_number}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', width: '15%', border: '1px solid #e0e0e0' }}>
                    Location Type
                  </TableCell>
                  <TableCell sx={{ width: '20%', border: '1px solid #e0e0e0' }}>
                    <Chip label={document.location_type.replace('_', ' ')} color="primary" size="small" />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', width: '15%', border: '1px solid #e0e0e0' }}>
                    Status
                  </TableCell>
                  <TableCell sx={{ width: '15%', border: '1px solid #e0e0e0' }}>
                    <Chip
                      label={statusConfig.label}
                      size="small"
                      sx={{ backgroundColor: statusConfig.bg, color: statusConfig.color, fontWeight: 600 }}
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                    Document Date
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                    {format(new Date(document.document_date), 'dd-MM-yyyy')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                    Effective From
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                    {format(new Date(document.effective_from), 'dd-MM-yyyy')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                    Effective To
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                    {document.effective_to
                      ? format(new Date(document.effective_to), 'dd-MM-yyyy')
                      : 'Ongoing'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                    Total Entries
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #e0e0e0' }}>
                    {document.total_entries || priceEntries.length}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                    Remarks
                  </TableCell>
                  <TableCell colSpan={3} sx={{ border: '1px solid #e0e0e0' }}>
                    {document.remarks || '-'}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Channel Partner Filters */}
        {['SUPERSTOCKIST', 'DISTRIBUTOR', 'RETAILER'].includes(document.location_type) &&
         (document.cp_filter_state || document.cp_filter_city || document.cp_filter_area) && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 2 }}>
              Applied Filters
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {document.cp_filter_state && (
                <Chip label={`State: ${filterNames.stateName || 'Loading...'}`} size="small" sx={{ backgroundColor: '#fff3e0', color: '#e65100' }} />
              )}
              {document.cp_filter_city && (
                <Chip label={`City: ${filterNames.cityName || 'Loading...'}`} size="small" sx={{ backgroundColor: '#fff3e0', color: '#e65100' }} />
              )}
              {document.cp_filter_area && (
                <Chip label={`Area: ${filterNames.areaName || 'Loading...'}`} size="small" sx={{ backgroundColor: '#fff3e0', color: '#e65100' }} />
              )}
            </Box>
          </Box>
        )}

        {/* Price Grid */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 2 }}>
            Price Entries
          </Typography>
          {(() => {
            const { items, locations, priceMatrix } = buildPriceGrid();
            return (
              <TableContainer>
                <Table size="small" sx={{ border: '1px solid #e0e0e0' }}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#006766' }}>
                      <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>S.No</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>Product Code</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>Product Name</TableCell>
                      {locations.map((loc) => (
                        <TableCell key={loc.id} align="right" sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>
                          {loc.name}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3 + locations.length} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">No price entries found</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item, index) => (
                        <TableRow key={item.id} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' } }}>
                          <TableCell sx={{ border: '1px solid #e0e0e0' }}>{index + 1}</TableCell>
                          <TableCell sx={{ border: '1px solid #e0e0e0', fontWeight: 500 }}>{item.code || '-'}</TableCell>
                          <TableCell sx={{ border: '1px solid #e0e0e0' }}>{item.name || '-'}</TableCell>
                          {locations.map((loc) => {
                            const price = priceMatrix[`${item.id}-${loc.id}`];
                            return (
                              <TableCell key={loc.id} align="right" sx={{ border: '1px solid #e0e0e0', fontWeight: 600, color: price ? '#006766' : '#999' }}>
                                {price ? `₹${parseFloat(price).toFixed(2)}` : '-'}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            );
          })()}
        </Box>

        {/* Authorization History */}
        {document.id && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#006766', mb: 2 }}>
              Authorization History
            </Typography>
            <AuthorizationHistory modelPath="masters.pricebookdocument" instanceId={document.id} />
          </Box>
        )}

        {/* Footer */}
        <Box
          sx={{
            mt: 4,
            pt: 3,
            borderTop: '2px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="caption" sx={{ color: '#666' }}>
            Generated on {format(new Date(), 'dd-MM-yyyy, hh:mm a')}
          </Typography>
          <Typography variant="caption" sx={{ color: '#666' }}>
            Document: {document.document_number} | Total Entries: {priceEntries.length}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default PriceBookView;
