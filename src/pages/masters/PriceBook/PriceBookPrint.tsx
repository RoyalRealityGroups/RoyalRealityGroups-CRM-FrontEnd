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
import HomeIcon from '@mui/icons-material/Home';
import FolderIcon from '@mui/icons-material/Folder';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import { format } from 'date-fns';
import { priceBookDocumentApi, stateApi, cityApi, areaApi } from '../../../api/masters.api';
import { useToast } from '../../../contexts/ToastContext';
import { usePageTitle } from '../../../hooks';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import ScreenHeader from '../../../components/common/ScreenHeader';
import { getPageContainerStyles, getHeaderSectionStyles } from '../../../utils/spacing';
import type { RootState } from '../../../store/store';
import { hasPermission } from '../../../utils/permissions';

interface PrintData {
  document: any;
  priceEntries: any[];
}

interface FilterNames {
  stateName?: string;
  cityName?: string;
  areaName?: string;
}

const PriceBookPrint: React.FC = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const [searchParams] = useSearchParams();
  const documentId = searchParams.get('documentId');
  const { error: toastError } = useToast();
  const { setBreadcrumbs } = useBreadcrumbs();

  const [loading, setLoading] = useState(true);
  const [printData, setPrintData] = useState<PrintData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterNames, setFilterNames] = useState<FilterNames>({});
  const canPrint = hasPermission(user, 'print_pricebook');

  useEffect(() => {
    if (!canPrint) {
      navigate('/unauthorized', { replace: true });
    }
  }, [canPrint, navigate]);

  // Sync breadcrumbs to match other screens
  useEffect(() => {
    if (printData?.document) {
      setBreadcrumbs([
        { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
        // { label: 'Masters', path: '/masters', icon: <FolderIcon fontSize="small" /> },
        { label: 'Price Book', path: '/price-book', icon: <LibraryBooksIcon fontSize="small" /> },
        { label: 'Print', icon: <PrintIcon fontSize="small" /> },
      ]);
    }
    return () => setBreadcrumbs([]);
  }, [printData?.document, setBreadcrumbs]);

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
      
      setPrintData({
        document: data,
        priceEntries: data.price_entries || [],
      });

      // Fetch filter names if present
      const names: FilterNames = {};
      if (data.cp_filter_state) {
        try {
          const stateData = await stateApi.getState(data.cp_filter_state);
          names.stateName = stateData.name;
        } catch (e) {
        }
      }
      if (data.cp_filter_city) {
        try {
          const cityData = await cityApi.getCity(data.cp_filter_city);
          names.cityName = cityData.name;
        } catch (e) {
        }
      }
      if (data.cp_filter_area) {
        try {
          const areaData = await areaApi.getArea(data.cp_filter_area);
          names.areaName = areaData.name;
        } catch (e) {
        }
      }
      setFilterNames(names);
    } catch (err: any) {
      setError(err.message || 'Failed to load document');
      toastError('Failed to load document for printing');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    navigate('/price-book');
  };

  const getLocationLabel = (entry: any, locationType: string): string => {
    switch (locationType) {
      case 'BASE':
        return 'All Locations';
      case 'STATE':
        return entry.state_name || entry.state || '-';
      case 'CITY':
        return entry.city_name || entry.city || '-';
      case 'AREA':
        return entry.area_name || entry.area || '-';
      case 'SUPERSTOCKIST':
        return entry.superstockist_name || entry.superstockist || '-';
      case 'DISTRIBUTOR':
        return entry.distributor_name || entry.distributor || '-';
      case 'RETAILER':
        return entry.retailer_name || entry.retailer || '-';
      default:
        return '-';
    }
  };

  const getLocationId = (entry: any, locationType: string): string => {
    switch (locationType) {
      case 'STATE':
        return entry.state || '';
      case 'CITY':
        return entry.city || '';
      case 'AREA':
        return entry.area || '';
      case 'SUPERSTOCKIST':
        return entry.superstockist || '';
      case 'DISTRIBUTOR':
        return entry.distributor || '';
      case 'RETAILER':
        return entry.retailer || '';
      default:
        return 'base';
    }
  };

  // Build price grid matrix: items as rows, locations as columns
  const buildPriceGrid = () => {
    if (!printData) return { items: [], locations: [], priceMatrix: {} };

    const { document, priceEntries } = printData;
    
    // Extract unique items
    const itemsMap = new Map<string, { id: string; code: string; name: string }>();
    priceEntries.forEach(entry => {
      const itemId = entry.item || entry.item_id;
      if (!itemsMap.has(itemId)) {
        itemsMap.set(itemId, {
          id: itemId,
          code: entry.item_code || '',
          name: entry.item_name || '',
        });
      }
    });

    // Extract unique locations
    const locationsMap = new Map<string, { id: string; name: string }>();
    priceEntries.forEach(entry => {
      const locationId = getLocationId(entry, document.location_type);
      const locationName = getLocationLabel(entry, document.location_type);
      if (!locationsMap.has(locationId)) {
        locationsMap.set(locationId, { id: locationId, name: locationName });
      }
    });

    // Build price matrix: key = "itemId-locationId", value = price
    const priceMatrix: Record<string, string> = {};
    priceEntries.forEach(entry => {
      const itemId = entry.item || entry.item_id;
      const locationId = getLocationId(entry, document.location_type);
      const key = `${itemId}-${locationId}`;
      priceMatrix[key] = entry.selling_price || '0';
    });

    return {
      items: Array.from(itemsMap.values()),
      locations: Array.from(locationsMap.values()),
      priceMatrix,
    };
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, any> = {
      DRAFT: { bg: '#fff3cd', color: '#856404', label: 'Draft' },
      ACTIVE: { bg: '#d4edda', color: '#155724', label: 'Active' },
      CLOSED: { bg: '#d1ecf1', color: '#0c5460', label: 'Closed' },
    };
    return configs[status] || configs.ACTIVE;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !printData) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Failed to load document'}
        </Alert>
        <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={handleBack}>
          Back to List
        </Button>
      </Box>
    );
  }

  const { document, priceEntries } = printData;
  const statusConfig = getStatusConfig(document.status);

  return (
    <Box
      className="print-content"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: '#f5f5f5',
        overflow: 'auto',
        '@media print': {
          bgcolor: 'white',
          p: 2,
          overflow: 'visible',
        },
      }}
    >
      <Box sx={{ ...getHeaderSectionStyles(), '@media print': { display: 'none' } }}>
        <ScreenHeader
          title={`Price Book Print${document.document_number ? ` - ${document.document_number}` : ''}`}
          showBackButton
          onBack={handleBack}
          disableBox
        >
          {canPrint && (
            <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint}>
              Print
            </Button>
          )}
        </ScreenHeader>
      </Box>

      <Paper
        sx={{
          maxWidth: 1600,
          mx: 'auto',
          p: 4,
          '@media print': {
            boxShadow: 'none',
            p: 0,
          },
        }}
      >
        {/* Header Section */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: '#006766',
                    mb: 1,
                    fontFamily: '"Space Grotesk", "Poppins", sans-serif',
                  }}
                >
                  Price Book Document
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#333' }}>
                  {document.document_number}
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
                  '@media print': {
                    border: `2px solid ${statusConfig.color}`,
                  },
                }}
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Document Details - Compact Single Line */}
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 2,
                py: 1,
                '@media print': {
                  gap: 1.5,
                  py: 0.5,
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" sx={{ color: '#666', fontWeight: 600, fontSize: '0.75rem' }}>
                  Date:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {format(new Date(document.document_date), 'dd MMM yyyy')}
                </Typography>
              </Box>

              <Divider orientation="vertical" flexItem />
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" sx={{ color: '#666', fontWeight: 600, fontSize: '0.75rem' }}>
                  Type:
                </Typography>
                <Chip
                  label={document.location_type.replace('_', ' ')}
                  size="small"
                  sx={{
                    backgroundColor: '#e3f2fd',
                    color: '#1565c0',
                    fontWeight: 600,
                    height: 24,
                    fontSize: '0.75rem',
                    '@media print': {
                      backgroundColor: 'transparent',
                      border: '1px solid #1565c0',
                    },
                  }}
                />
              </Box>

              <Divider orientation="vertical" flexItem />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" sx={{ color: '#666', fontWeight: 600, fontSize: '0.75rem' }}>
                  Entries:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#006766' }}>
                  {document.total_entries || priceEntries.length}
                </Typography>
              </Box>

              <Divider orientation="vertical" flexItem />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" sx={{ color: '#666', fontWeight: 600, fontSize: '0.75rem' }}>
                  Effective:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {format(new Date(document.effective_from), 'dd MMM yyyy')}
                </Typography>
                <Typography variant="caption" sx={{ color: '#999', mx: 0.5 }}>to</Typography>
                {document.effective_to ? (
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {format(new Date(document.effective_to), 'dd MMM yyyy')}
                  </Typography>
                ) : (
                  <Chip
                    label="Ongoing"
                    size="small"
                    sx={{
                      backgroundColor: '#e8f5e9',
                      color: '#2e7d32',
                      fontWeight: 600,
                      height: 24,
                      fontSize: '0.7rem',
                      '@media print': {
                        backgroundColor: 'transparent',
                        border: '1px solid #2e7d32',
                      },
                    }}
                  />
                )}
              </Box>

              {document.remarks && (
                <>
                  <Divider orientation="vertical" flexItem />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ color: '#666', fontWeight: 600, fontSize: '0.75rem' }}>
                      Remarks:
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#555', fontStyle: 'italic' }}>
                      {document.remarks}
                    </Typography>
                  </Box>
                </>
              )}
            </Box>

            {/* Channel Partner Filters (if applicable) */}
            {['SUPERSTOCKIST', 'DISTRIBUTOR', 'RETAILER'].includes(document.location_type) && 
             (document.cp_filter_state || document.cp_filter_city || document.cp_filter_area) && (
              <>
                <Divider sx={{ my: 3 }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#006766', fontWeight: 700, mb: 2, textTransform: 'uppercase', fontSize: '0.8rem' }}>
                    Applied Filters
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {document.cp_filter_state && (
                      <Chip
                        label={`State: ${filterNames.stateName || 'Loading...'}`}
                        size="small"
                        sx={{ backgroundColor: '#fff3e0', color: '#e65100' }}
                      />
                    )}
                    {document.cp_filter_city && (
                      <Chip
                        label={`City: ${filterNames.cityName || 'Loading...'}`}
                        size="small"
                        sx={{ backgroundColor: '#fff3e0', color: '#e65100' }}
                      />
                    )}
                    {document.cp_filter_area && (
                      <Chip
                        label={`Area: ${filterNames.areaName || 'Loading...'}`}
                        size="small"
                        sx={{ backgroundColor: '#fff3e0', color: '#e65100' }}
                      />
                    )}
                  </Box>
                </Box>
              </>
            )}
          </Box>

          {/* Price Grid - Items as Rows, Locations as Columns */}
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 2,
                color: '#006766',
                textTransform: 'uppercase',
                fontSize: '0.9rem',
                letterSpacing: '0.5px',
              }}
            >
              Price Grid
            </Typography>

            {(() => {
              const { items, locations, priceMatrix } = buildPriceGrid();
              const columnCount = 3 + locations.length;
              
              // Determine layout mode based on column count
              const layoutMode = locations.length <= 6 ? 'normal' : 
                                locations.length <= 12 ? 'compact' : 'ultra-compact';
              const manyColumns = layoutMode !== 'normal';
              
              // Dynamic page size: A4 for ≤12 columns, A3 for more
              const pageSize = locations.length <= 12 ? 'A4 landscape' : 'A3 landscape';
              
              // Calculate optimal column widths to prevent overlap
              const getColWidths = () => {
                if (layoutMode === 'normal') {
                  return { sno: 40, code: 90, name: 140, location: 80, fontSize: 9, padding: '4px 6px' };
                } else if (layoutMode === 'compact') {
                  return { sno: 30, code: 70, name: 100, location: 65, fontSize: 8, padding: '3px 5px' };
                } else {
                  return { sno: 25, code: 60, name: 85, location: 55, fontSize: 7, padding: '2px 4px' };
                }
              };
              const colWidths = getColWidths();
              
              return (
                <TableContainer
                  sx={{
                    '@media print': {
                      boxShadow: 'none',
                      overflow: 'visible',
                    },
                  }}
                >
                  <Table
                    size="small"
                    sx={{
                      '@media print': {
                        tableLayout: 'fixed',
                        width: '100%',
                        borderCollapse: 'collapse',
                      },
                      '& .MuiTableCell-root': {
                        borderColor: '#e0e0e0',
                        border: '1px solid #e0e0e0',
                        '@media print': {
                          fontSize: `${colWidths.fontSize}px`,
                          padding: colWidths.padding,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        },
                      },
                    }}
                  >
                    <TableHead>
                      <TableRow
                        sx={{
                          backgroundColor: '#006766',
                          '& .MuiTableCell-head': {
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            '@media print': {
                              color: 'black',
                              backgroundColor: '#e0e0e0',
                              fontSize: `${colWidths.fontSize}px`,
                              fontWeight: 700,
                            },
                          },
                        }}
                      >
                        <TableCell sx={{ width: colWidths.sno, '@media print': { width: `${colWidths.sno}px` } }}>S.No</TableCell>
                        <TableCell sx={{ width: colWidths.code, '@media print': { width: `${colWidths.code}px` } }}>Item Code</TableCell>
                        <TableCell sx={{ width: colWidths.name, '@media print': { width: `${colWidths.name}px` } }}>Item Name</TableCell>
                        {locations.map((location) => (
                          <TableCell 
                            key={location.id} 
                            align="right"
                            title={location.name}
                            sx={{ 
                              width: colWidths.location,
                              '@media print': {
                                width: `${colWidths.location}px`,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              },
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {location.name}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={columnCount} align="center" sx={{ py: 4 }}>
                            <Typography variant="body2" color="text.secondary">
                              No price entries found
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        items.map((item, index) => (
                          <TableRow
                            key={item.id}
                            sx={{
                              '&:nth-of-type(odd)': {
                                backgroundColor: '#f9f9f9',
                              },
                              '&:hover': {
                                backgroundColor: '#f0f7f7',
                                '@media print': {
                                  backgroundColor: 'inherit',
                                },
                              },
                            }}
                          >
                            <TableCell>{index + 1}</TableCell>
                            <TableCell sx={{ fontWeight: 500 }}>{item.code || '-'}</TableCell>
                            <TableCell>{item.name || '-'}</TableCell>
                            {locations.map((location) => {
                              const key = `${item.id}-${location.id}`;
                              const price = priceMatrix[key];
                              return (
                                <TableCell 
                                  key={location.id} 
                                  align="right"
                                  sx={{ 
                                    fontWeight: 600, 
                                    color: price ? '#006766' : '#999',
                                  }}
                                >
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

          {/* Footer */}
          <Box
            sx={{
              mt: 4,
              pt: 3,
              borderTop: '2px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              '@media print': {
                mt: 2,
                pt: 2,
                fontSize: '9px',
              },
            }}
          >
            <Typography variant="caption" sx={{ color: '#666', '@media print': { fontSize: '9px' } }}>
              Generated on {format(new Date(), 'dd MMM yyyy, hh:mm a')}
            </Typography>
            <Typography variant="caption" sx={{ color: '#666', '@media print': { fontSize: '9px' } }}>
              Total Entries: {priceEntries.length}
            </Typography>
          </Box>
        </Paper>

      {/* Print Styles */}
      <style>
        {`
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            
            @page {
              size: ${printData && printData.priceEntries.length > 0 ? 
                ((() => {
                  const { locations } = buildPriceGrid();
                  return locations.length <= 12 ? 'A4 landscape' : 'A3 landscape';
                })()) : 'A4 landscape'};
              margin: 10mm;
            }
            
            .no-print {
              display: none !important;
            }
            
            /* Hide sidebar, navigation, and all other UI elements */
            nav,
            aside,
            header:not(.print-header),
            .MuiDrawer-root,
            .MuiAppBar-root,
            [class*="sidebar"],
            [class*="Sidebar"],
            [class*="navigation"],
            [class*="Navigation"],
            [role="navigation"] {
              display: none !important;
            }
            
            /* Ensure only print content is visible */
            body > div:not(:has(.print-content)) {
              display: none !important;
            }
            
            * {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        `}
      </style>
    </Box>
  );
};

export default PriceBookPrint;
