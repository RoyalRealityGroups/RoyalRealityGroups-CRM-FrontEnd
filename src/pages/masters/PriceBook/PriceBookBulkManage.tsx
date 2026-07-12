import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Autocomplete,
  Chip,
  Stack,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  Pagination,
  Alert,
  Checkbox,
  ListItemText,
  CircularProgress,
  Divider,
  Tabs,
  Tab,
  Grid,
  Tooltip,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { toDateString } from '../../../utils/format';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';
import HomeIcon from '@mui/icons-material/Home';
import FolderIcon from '@mui/icons-material/Folder';
import PriceIcon from '@mui/icons-material/LocalOffer';
import { useToast } from '../../../contexts/ToastContext';
import { usePageTitle } from '../../../hooks';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import ScreenHeader from '../../../components/common/ScreenHeader';
import SearchableDropdown from '../../../components/common/SearchableDropdown';
import {
  getPageContainerStyles,
  getHeaderSectionStyles,
  getContentSectionStyles,
} from '../../../utils/spacing';
import { 
  itemApi, 
  categoryApi, 
  brandApi, 
  stateApi, 
  cityApi, 
  areaApi,
  superstockistApi,
  distributorApi,
  retailerApi,
  priceBookApi,
  channelConfigApi,
  priceBookDocumentApi
} from '../../../api/masters.api';
import { API_ENDPOINTS } from '../../../utils/constants';
import type { 
  Item,
  Category, 
  Brand, 
  State, 
  City, 
  Area,
  Superstockist,
  Distributor,
  Retailer,
  PriceType,
  BulkPriceBookEntry
} from '../../../types/masters.types';
import type { DropdownOption } from '../../../types/common.types';
import apiClient from '../../../api/axios.config';

type UpdateMode = 'BULK' | 'ITEMWISE';
type LocationType = 'BASE' | 'STATE' | 'CITY' | 'AREA' | 'SUPERSTOCKIST' | 'DISTRIBUTOR' | 'RETAILER';

// Performance: Limit max locations to prevent browser slowdown
const MAX_GRID_LOCATIONS = 100;

interface GridCell {
  itemId: string;
  locationId: string;
  locationType: LocationType;
  price: string;
  existingPrice?: string;
  parentPrice?: string;
  parentLevel?: string;
  parentLocationName?: string;
  modified: boolean;
  errors?: string[];
}

interface FieldVisibility {
  price: boolean;
}

// Helpers to normalize location identifiers from API responses (can be plain IDs or nested objects)
const normalizeId = (value: any): string | number | undefined => {
  if (value === null || value === undefined) return undefined;
  return (value as any)?.id !== undefined ? (value as any).id : value;
};

const getLocationIdFromEntry = (entry: any, type?: LocationType): string => {
  const getId = (value: any) => {
    const id = normalizeId(value);
    return id ? String(id) : undefined;
  };

  const orderByType: Record<LocationType, string[]> = {
    BASE: [],
    STATE: ['state'],
    CITY: ['city', 'state'],
    AREA: ['area', 'city', 'state'],
    SUPERSTOCKIST: ['superstockist'],
    DISTRIBUTOR: ['distributor', 'superstockist'],
    RETAILER: ['retailer', 'distributor', 'superstockist'],
  };

  const orderedFields = type ? orderByType[type] : ['area', 'city', 'state', 'superstockist', 'distributor', 'retailer'];

  for (const field of orderedFields) {
    const id = getId((entry as any)[field]);
    if (id) {
      return id;
    }
  }

  // Fallback to any location-ish fields if type is missing
  const fallbackCandidates = [entry.area, entry.city, entry.state, entry.superstockist, entry.distributor, entry.retailer];
  for (const candidate of fallbackCandidates) {
    const id = getId(candidate);
    if (id) {
      return id;
    }
  }

  return '';
};

// Extract a readable location name from varied API shapes
const getLocationName = (loc: any): string => {
  if (!loc) return '';
  const candidates = [loc.name, loc.area_name, loc.city_name, loc.state_name, loc.display_name, loc.code];
  const name = candidates.find((v) => typeof v === 'string' && v.trim().length > 0);
  return name || String(loc.id ?? '');
};

const PriceBookBulkManage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const documentId = searchParams.get('documentId');
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();

  // Filter states
  const [selectedItemOptions, setSelectedItemOptions] = useState<DropdownOption[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedLocationOptions, setSelectedLocationOptions] = useState<DropdownOption[]>([]);
  const [locationType, setLocationType] = useState<LocationType>('BASE');
  // Filter state for CITY/AREA location types (single selection)
  const [filterState, setFilterState] = useState<string>('');
  const [filterCity, setFilterCity] = useState<string>('');
  
  // Filter state for Channel Partner location types (optional filters)
  const [cpFilterState, setCpFilterState] = useState<DropdownOption | null>(null);
  const [cpFilterCity, setCpFilterCity] = useState<DropdownOption | null>(null);
  const [cpFilterArea, setCpFilterArea] = useState<DropdownOption | null>(null);
  // const [priceType, setPriceType] = useState<PriceType>('GEOGRAPHIC');
  
  // Track if locations were loaded from existing document (using ref for synchronous check)
  const locationsLoadedFromDocument = useRef<boolean>(false);
  const isInitializingFromDocument = useRef<boolean>(false);
  
  // Store extracted category/brand IDs to apply once categories/brands load
  const pendingCategoryIds = useRef<string[]>([]);
  const pendingBrandIds = useRef<string[]>([]);
  
  // Track when pending selections are populated (for triggering effects)
  const [pendingSelectionsReady, setPendingSelectionsReady] = useState(false);

  // Document info
  const [documentNumber, setDocumentNumber] = useState<string>('');
  const [documentDate, setDocumentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [saveAsDraft, setSaveAsDraft] = useState<boolean>(false);
  const [documentStatus, setDocumentStatus] = useState<string | null>(null);

  // Channel configuration
  const [channelConfig, setChannelConfig] = useState<{
    enable_superstockist: boolean;
    enable_distributor: boolean;
    enable_retailer: boolean;
  } | null>(null);

  // Load document number and channel config on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Check if editing existing document
        if (documentId) {
          // Load existing document with price entries
          const documentData = await priceBookDocumentApi.getDocument(documentId);
          
          // Set flags BEFORE setting locationType to prevent automatic location loading
          if (documentData.price_entries && documentData.price_entries.length > 0) {
            locationsLoadedFromDocument.current = true;
            isInitializingFromDocument.current = true;
          }
          
          // Populate document fields
          setDocumentNumber(documentData.document_number);
          setDocumentDate(documentData.document_date);
          setDocumentStatus(documentData.status || null);
          setLocationType(documentData.location_type);
          setEffectiveFrom(documentData.effective_from);
          setEffectiveTo(documentData.effective_to || '');
          
          // Populate bulk adjustment fields if present
          if (documentData.bulk_adjustment) {
            const ba = documentData.bulk_adjustment;
            setBulkType(ba.adjustment_type === 'percentage' ? 'PERCENTAGE' : 'AMOUNT');
            setBulkDirection(ba.update_type === 'increase_by' ? 'INCREASE' : 'DECREASE');
            setBulkAdjustment(String(ba.adjustment_value || ''));
            setUpdateMode('BULK');
          }
          
          // Store original values for change detection
          setOriginalDocumentData({
            effectiveFrom: documentData.effective_from,
            effectiveTo: documentData.effective_to || '',
            documentDate: documentData.document_date,
            cpFilterStateId: documentData.cp_filter_state ? String(documentData.cp_filter_state) : null,
            cpFilterCityId: documentData.cp_filter_city ? String(documentData.cp_filter_city) : null,
            cpFilterAreaId: documentData.cp_filter_area ? String(documentData.cp_filter_area) : null,
          });

          // Rehydrate optional channel partner filters for editing
          if (
            ['SUPERSTOCKIST', 'DISTRIBUTOR', 'RETAILER'].includes(documentData.location_type) &&
            (documentData.cp_filter_state || documentData.cp_filter_city || documentData.cp_filter_area)
          ) {
            try {
              if (documentData.cp_filter_area) {
                const areaData = await areaApi.getArea(documentData.cp_filter_area);
                setCpFilterArea({ id: areaData.id, name: areaData.name || String(areaData.id) });

                const cityId = (areaData.city as any)?.id || areaData.city;
                if (cityId) {
                  const cityData = await cityApi.getCity(String(cityId));
                  setCpFilterCity({ id: cityData.id, name: cityData.name || String(cityData.id) });

                  const stateId = (cityData.state as any)?.id || cityData.state;
                  if (stateId) {
                    const stateData = await stateApi.getState(String(stateId));
                    setCpFilterState({ id: stateData.id, name: stateData.name || String(stateData.id) });
                  }
                }
              } else if (documentData.cp_filter_city) {
                const cityData = await cityApi.getCity(String(documentData.cp_filter_city));
                setCpFilterCity({ id: cityData.id, name: cityData.name || String(cityData.id) });

                const stateId = (cityData.state as any)?.id || cityData.state;
                if (stateId) {
                  const stateData = await stateApi.getState(String(stateId));
                  setCpFilterState({ id: stateData.id, name: stateData.name || String(stateData.id) });
                }
              } else if (documentData.cp_filter_state) {
                const stateData = await stateApi.getState(String(documentData.cp_filter_state));
                setCpFilterState({ id: stateData.id, name: stateData.name || String(stateData.id) });
              }
            } catch (error) {
            }
          }
          
          // Populate item-related filters and their selections from the document
          if (documentData.price_entries && documentData.price_entries.length > 0) {
            try {
              // Extract unique item IDs first
              const uniqueItemIds = [...new Set(
                documentData.price_entries
                  .map((e: any) => {
                    const itm = (e.item as any)?.id ?? e.item;
                    return normalizeId(itm);
                  })
                  .filter(Boolean)
              )];
              
              
              // Fetch full item details
              let fetchedItems: Item[] = [];
              if (uniqueItemIds.length > 0) {
                const itemPromises = uniqueItemIds.map(id => 
                  itemApi.getItem(String(id)).catch(() => null)
                );
                const itemData = await Promise.all(itemPromises);
                fetchedItems = itemData.filter((item): item is Item => item !== null);
              }
              
              // Restore selections ONLY if they were explicitly stored in the document
              // Check if document has category/brand selections saved
              if ((documentData as any).selected_categories) {
                const categoryIds = (documentData as any).selected_categories;
                pendingCategoryIds.current = categoryIds;
              }
              
              if ((documentData as any).selected_brands) {
                const brandIds = (documentData as any).selected_brands;
                pendingBrandIds.current = brandIds;
              }
              
              // Trigger state change to notify effects that pending selections are ready
              setPendingSelectionsReady(prev => !prev);
              
              // Set selected items
              if (fetchedItems.length > 0) {
                const itemOptions = fetchedItems.map(i => ({ id: i.id, name: i.name || i.code }));
                setSelectedItemOptions(itemOptions);
              }
            } catch (error) {
              // Non-critical error, continue
            }
          }
          
          // Convert price entries to grid format
          if (documentData.price_entries && documentData.price_entries.length > 0) {
            const gridCells: GridCell[] = documentData.price_entries.map((entry: any) => ({
              itemId: entry.item,
              locationId: getLocationIdFromEntry(entry, documentData.location_type),
              locationType: documentData.location_type,
              price: entry.selling_price,
              existingPrice: entry.selling_price,
              modified: false,
              errors: [],
            }));
            setGridData(gridCells);
            
            // Load only the specific locations that have price entries
            try {
              if (documentData.location_type === 'STATE' && documentData.price_entries[0]?.state) {
                const uniqueStateIds = [...new Set(documentData.price_entries
                  .map((e: any) => (e.state as any)?.id ?? e.state)
                  .filter(Boolean))];
                const statePromises = uniqueStateIds.map(id => stateApi.getState(String(id)));
                const stateData = await Promise.all(statePromises);
                const sortedStates = stateData.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                setLocations(sortedStates);
                setSelectedLocations(sortedStates.map((s) => String(s.id)));
                setSelectedLocationOptions(sortedStates.map((s) => ({ id: s.id, name: s.name || String(s.id) })));
              }
              else if (documentData.location_type === 'CITY' && documentData.price_entries[0]?.city) {
                const uniqueCityIds = [...new Set(documentData.price_entries
                  .map((e: any) => (e.city as any)?.id ?? e.city)
                  .filter(Boolean))];
                const cityPromises = uniqueCityIds.map(id => cityApi.getCity(String(id)));
                const cityData = await Promise.all(cityPromises);
                const sortedCities = cityData.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                setLocations(sortedCities);
                
                // Set filterState from first city for dropdown functionality (use id)
                const firstCityStateId = (sortedCities[0]?.state as any)?.id || sortedCities[0]?.state;
                if (firstCityStateId) {
                  setFilterState(String(firstCityStateId));
                  // Derive state name from city payload or fetch if missing
                  const stateName = (sortedCities[0].state as any)?.name;
                  if (stateName) {
                    setSelectedFilterState({ id: firstCityStateId, name: stateName });
                  } else {
                    const stateData = await stateApi.getState(String(firstCityStateId));
                    setSelectedFilterState({ id: stateData.id, name: stateData.name || String(stateData.id) });
                  }
                }
                
                // Defer setting selections to next tick to ensure dropdown is ready
                const selectedIds = sortedCities.map((c) => String(c.id));
                const selectedOptions = sortedCities.map((c) => ({ id: c.id, name: c.name || String(c.id) }));
                setTimeout(() => {
                  setSelectedLocations(selectedIds);
                  setSelectedLocationOptions(selectedOptions);
                }, 100);
              }
              else if (documentData.location_type === 'AREA' && documentData.price_entries[0]?.area) {
                const uniqueAreaIds = [...new Set(documentData.price_entries
                  .map((e: any) => (e.area as any)?.id ?? e.area)
                  .filter(Boolean))];
                const areaPromises = uniqueAreaIds.map(id => areaApi.getArea(String(id)));
                const areaData = await Promise.all(areaPromises);
                const sortedAreas = areaData.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                
                // IMPORTANT: Set filters FIRST before setting locations/selections
                // This ensures the dropdown is enabled when we set selected values
                const firstAreaCityId = (sortedAreas[0]?.city as any)?.id || sortedAreas[0]?.city;
                if (firstAreaCityId) {
                  const cityData = await cityApi.getCity(String(firstAreaCityId));
                  const cityStateId = (cityData.state as any)?.id || cityData.state;
                  
                  if (cityStateId) {
                    // Set filter state first
                    setFilterState(String(cityStateId));
                    const stateName = (cityData.state as any)?.name;
                    if (stateName) {
                      setSelectedFilterState({ id: cityStateId, name: stateName });
                    } else {
                      const stateData = await stateApi.getState(String(cityStateId));
                      setSelectedFilterState({ id: stateData.id, name: stateData.name || String(stateData.id) });
                    }
                  }
                  
                  // Then set filter city
                  setFilterCity(String(firstAreaCityId));
                  setSelectedFilterCity({ id: cityData.id, name: cityData.name || String(cityData.id) });
                }
                
                // NOW set locations and selections after filters are in place
                // Stable documentId key prevents SearchableDropdown remount
                setLocations(sortedAreas);
                
                // Defer setting selections to next tick to ensure dropdown is ready
                const selectedIds = sortedAreas.map((a) => String(a.id));
                const selectedOptions = sortedAreas.map((a) => ({ id: a.id, name: a.name || String(a.id) }));
                
                setTimeout(() => {
                  setSelectedLocations(selectedIds);
                  setSelectedLocationOptions(selectedOptions);
                }, 100);
              }
              else if (documentData.location_type === 'SUPERSTOCKIST' && documentData.price_entries[0]?.superstockist) {
                const uniqueSSIds = [...new Set(documentData.price_entries
                  .map((e: any) => (e.superstockist as any)?.id ?? e.superstockist)
                  .filter(Boolean))];
                const ssPromises = uniqueSSIds.map(id => superstockistApi.getSuperstockist(String(id)));
                const ssData = await Promise.all(ssPromises);
                const sortedSS = ssData.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                setLocations(sortedSS);
                setSelectedLocations(sortedSS.map((s) => String(s.id)));
                setSelectedLocationOptions(sortedSS.map((s) => ({ id: s.id, name: s.name || String(s.id) })));
              }
              else if (documentData.location_type === 'DISTRIBUTOR' && documentData.price_entries[0]?.distributor) {
                const uniqueDistIds = [...new Set(documentData.price_entries
                  .map((e: any) => (e.distributor as any)?.id ?? e.distributor)
                  .filter(Boolean))];
                const distPromises = uniqueDistIds.map(id => distributorApi.getDistributor(String(id)));
                const distData = await Promise.all(distPromises);
                const sortedDists = distData.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                setLocations(sortedDists);
                setSelectedLocations(sortedDists.map((d) => String(d.id)));
                setSelectedLocationOptions(sortedDists.map((d) => ({ id: d.id, name: d.name || String(d.id) })));
              }
              else if (documentData.location_type === 'RETAILER' && documentData.price_entries[0]?.retailer) {
                const uniqueRetailerIds = [...new Set(documentData.price_entries
                  .map((e: any) => (e.retailer as any)?.id ?? e.retailer)
                  .filter(Boolean))];
                const retailerPromises = uniqueRetailerIds.map(id => retailerApi.getRetailer(String(id)));
                const retailerData = await Promise.all(retailerPromises);
                const sortedRetailers = retailerData.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                setLocations(sortedRetailers);
                setSelectedLocations(sortedRetailers.map((r) => String(r.id)));
                setSelectedLocationOptions(sortedRetailers.map((r) => ({ id: r.id, name: r.name || String(r.id) })));
              }
            } catch (error) {
              toastError('Failed to load locations from document');
            }
          }
        } else {
          // Generate new document number
          const docResponse = await priceBookApi.generateDocumentNumber();
          setDocumentNumber(docResponse.document_number);
        }

        // Fetch channel configuration
        const config = await channelConfigApi.getChannelConfig();
        setChannelConfig(config);

        // Fetch item field configuration
        try {
          const fieldConfigResponse = await apiClient.get('/api/masters/item-field-config/');
          const fieldConfig = fieldConfigResponse.data;
          const sellingPriceConfig = fieldConfig.find((f: any) => f.field_name === 'selling_price');
          
          const config = {
            selling_price_visible: sellingPriceConfig?.is_visible ?? true,
          };
          setItemFieldConfig(config);
          
          // Update field visibility based on item configuration
          setFieldVisibility({
            price: config.selling_price_visible,
          });
        } catch (error) {
          setItemFieldConfig({ selling_price_visible: true });
          setFieldVisibility({ price: true });
          toastWarning('Failed to load item field config; using defaults');
        }
      } catch (error: any) {
        const errorMessage = error.response?.status === 404 
          ? 'Document not found' 
          : 'Failed to load data';
        toastError(errorMessage);
      }
    };
    loadInitialData();
  }, [documentId]);

  // Filter dropdown data (for CITY and AREA types)
  const [selectedFilterState, setSelectedFilterState] = useState<DropdownOption | null>(null);
  const [selectedFilterCity, setSelectedFilterCity] = useState<DropdownOption | null>(null);

  // Reset selections and filters when location type changes
  useEffect(() => {
    if (locationsLoadedFromDocument.current) return; // keep existing selections on edit load

    setSelectedLocations([]);
    setSelectedLocationOptions([]);
    // Reset channel partner filters when switching location types
    if (['SUPERSTOCKIST', 'DISTRIBUTOR', 'RETAILER'].includes(locationType)) {
      // Keep filters when switching between channel partner types
    } else {
      // Clear channel partner filters when switching to geographic types
      setCpFilterState(null);
      setCpFilterCity(null);
      setCpFilterArea(null);
    }
    // Don't clear state/city filters here - let the more specific logic below handle it
  }, [locationType]);

  // Reset filter city and selected locations when filter state changes
  useEffect(() => {
    if (locationsLoadedFromDocument.current || isInitializingFromDocument.current) return; // preserve during document initialization
    if (filterState) {
      setFilterCity('');
      setSelectedLocations([]);
      setSelectedLocationOptions([]);
    }
  }, [filterState]);

  // Reset selected locations when filter city changes
  useEffect(() => {
    if (locationsLoadedFromDocument.current || isInitializingFromDocument.current) return; // preserve during document initialization
    if (filterCity) {
      setSelectedLocations([]);
      setSelectedLocationOptions([]);
    }
  }, [filterCity]);

  // Backfill filter state/city from selected filter options (handles edit pre-population)
  useEffect(() => {
    if (!filterState && selectedFilterState?.id) {
      setFilterState(String(selectedFilterState.id));
    }
  }, [filterState, selectedFilterState]);

  useEffect(() => {
    if (!filterCity && selectedFilterCity?.id) {
      setFilterCity(String(selectedFilterCity.id));
    }
  }, [filterCity, selectedFilterCity]);

  // Helper functions for location type labels
  const getLocationSelectionTitle = (): string => {
    switch (locationType) {
      case 'STATE':
        return 'State Selection';
      case 'CITY':
        return 'City Selection';
      case 'AREA':
        return 'Area Selection';
      case 'SUPERSTOCKIST':
        return 'Superstockist Selection';
      case 'DISTRIBUTOR':
        return 'Distributor Selection';
      case 'RETAILER':
        return 'Retailer Selection';
      default:
        return 'Location Selection';
    }
  };

  const getLocationSelectionLabel = (): string => {
    switch (locationType) {
      case 'STATE':
        return 'Select States';
      case 'CITY':
        return 'Select Cities';
      case 'AREA':
        return 'Select Areas';
      case 'SUPERSTOCKIST':
        return 'Select Superstockists';
      case 'DISTRIBUTOR':
        return 'Select Distributors';
      case 'RETAILER':
        return 'Select Retailers';
      default:
        return 'Select Locations';
    }
  };

  const getLocationSelectionPlaceholder = (): string => {
    switch (locationType) {
      case 'STATE':
        return 'Search and select states';
      case 'CITY':
        return 'Search and select cities';
      case 'AREA':
        return 'Search and select areas';
      case 'SUPERSTOCKIST':
        return 'Search and select superstockists';
      case 'DISTRIBUTOR':
        return 'Search and select distributors';
      case 'RETAILER':
        return 'Search and select retailers';
      default:
        return 'Search and select locations';
    }
  };

  const getLocationEndpoint = () => {
    switch (locationType) {
      case 'STATE':
        return API_ENDPOINTS.STATES;
      case 'CITY':
        return API_ENDPOINTS.CITIES;
      case 'AREA':
        return API_ENDPOINTS.AREAS;
      case 'SUPERSTOCKIST':
        return API_ENDPOINTS.SUPERSTOCKISTS;
      case 'DISTRIBUTOR':
        return API_ENDPOINTS.DISTRIBUTORS;
      case 'RETAILER':
        return API_ENDPOINTS.RETAILERS;
      default:
        return '';
    }
  };

  // Memoized additional filters for location selection based on location type and filter values
  const locationAdditionalFilters = useMemo(() => {
    if (locationType === 'CITY') {
      return filterState ? { state: filterState } : undefined;
    }
    if (locationType === 'AREA') {
      return filterCity ? { city: filterCity } : undefined;
    }
    if (['SUPERSTOCKIST', 'DISTRIBUTOR', 'RETAILER'].includes(locationType)) {
      const filters: Record<string, any> = {};
      if (cpFilterState?.id) filters.state = cpFilterState.id;
      if (cpFilterCity?.id) filters.city = cpFilterCity.id;
      if (cpFilterArea?.id) filters.area = cpFilterArea.id;
      return Object.keys(filters).length > 0 ? filters : undefined;
    }
    return undefined;
  }, [locationType, filterState, filterCity, cpFilterState, cpFilterCity, cpFilterArea]);

  // Memoized key for location selection dropdown to trigger remount when filters change
  const locationSelectionKey = useMemo(() => {
    if (documentId) {
      return `location-edit-${documentId}`;
    }
    const filterPart = 
      locationType === 'CITY' ? filterState || selectedFilterState?.id || 'none' :
      locationType === 'AREA' ? `${filterState || selectedFilterState?.id || 'none'}-${filterCity || selectedFilterCity?.id || 'none'}` :
      ['SUPERSTOCKIST', 'DISTRIBUTOR', 'RETAILER'].includes(locationType) ? 
        `${cpFilterState?.id || 'none'}-${cpFilterCity?.id || 'none'}-${cpFilterArea?.id || 'none'}` :
      'none';
    return `location-select-${getLocationEndpoint()}-${filterPart}`;
  }, [documentId, locationType, filterState, selectedFilterState?.id, filterCity, selectedFilterCity?.id, cpFilterState?.id, cpFilterCity?.id, cpFilterArea?.id]);
  const [bulkAdjustment, setBulkAdjustment] = useState('');
  const [bulkType, setBulkType] = useState<'AMOUNT' | 'PERCENTAGE'>('PERCENTAGE');
  const [bulkDirection, setBulkDirection] = useState<'INCREASE' | 'DECREASE'>('INCREASE');
  const [updateMode, setUpdateMode] = useState<UpdateMode>('BULK');

  // Dates
  const [effectiveFrom, setEffectiveFrom] = useState<string>(new Date().toISOString().split('T')[0]);
  const [effectiveTo, setEffectiveTo] = useState<string>('');

  // Track original document values for change detection
  const [originalDocumentData, setOriginalDocumentData] = useState<{
    effectiveFrom: string;
    effectiveTo: string;
    documentDate: string;
    cpFilterStateId: string | null;
    cpFilterCityId: string | null;
    cpFilterAreaId: string | null;
  } | null>(null);

  // Check if document fields have changed
  const hasDocumentChanges = useMemo(() => {
    if (!originalDocumentData) return false;
    const currentCpFilterState = cpFilterState ? String(cpFilterState.id) : null;
    const currentCpFilterCity = cpFilterCity ? String(cpFilterCity.id) : null;
    const currentCpFilterArea = cpFilterArea ? String(cpFilterArea.id) : null;
    return (
      effectiveFrom !== originalDocumentData.effectiveFrom ||
      effectiveTo !== originalDocumentData.effectiveTo ||
      documentDate !== originalDocumentData.documentDate ||
      currentCpFilterState !== originalDocumentData.cpFilterStateId ||
      currentCpFilterCity !== originalDocumentData.cpFilterCityId ||
      currentCpFilterArea !== originalDocumentData.cpFilterAreaId
    );
  }, [effectiveFrom, effectiveTo, documentDate, cpFilterState, cpFilterCity, cpFilterArea, originalDocumentData]);

  // Field visibility
  const [fieldVisibility, setFieldVisibility] = useState<FieldVisibility>({
    price: true,
  });

  const [activeTab, setActiveTab] = useState(0);

  // Field configuration from item master
  const [itemFieldConfig, setItemFieldConfig] = useState<{
    selling_price_visible: boolean;
  } | null>(null);

  // Data
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [locations, setLocations] = useState<Array<State | City | Area | Superstockist | Distributor | Retailer>>([]);
  const [gridData, setGridData] = useState<GridCell[]>([]);
  


  // Apply pending category/brand selections once they load
  useEffect(() => {
    if (documentId && categories.length > 0 && pendingCategoryIds.current.length > 0) {
      // Apply if not already applied (selectedCategories is empty)
      if (selectedCategories.length === 0) {
        setSelectedCategories(pendingCategoryIds.current);
      }
    }
  }, [documentId, categories.length, selectedCategories.length, pendingSelectionsReady]);

  useEffect(() => {
    if (documentId && brands.length > 0 && pendingBrandIds.current.length > 0) {
      // Apply if not already applied (selectedBrands is empty)
      if (selectedBrands.length === 0) {
        setSelectedBrands(pendingBrandIds.current);
      }
    }
  }, [documentId, brands.length, selectedBrands.length, pendingSelectionsReady]);
  
  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  // Loading states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Error states
  const [errors, setErrors] = useState<string[]>([]);

  // Refs for synchronized scrolling
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);

  // Load dropdown data
  useEffect(() => {
    loadDropdownData();
  }, []);

  // Clear location filters when switching types
  useEffect(() => {
    if (locationType === 'BASE' || locationType === 'STATE') {
      setFilterState('');
      setFilterCity('');
      setSelectedFilterState(null);
      setSelectedFilterCity(null);
    }
    if (locationType === 'CITY') {
      setFilterCity('');
      setSelectedFilterCity(null);
    }
    // Clear channel partner filters when switching to non-channel-partner types
    if (!['SUPERSTOCKIST', 'DISTRIBUTOR', 'RETAILER'].includes(locationType)) {
      setCpFilterState(null);
      setCpFilterCity(null);
      setCpFilterArea(null);
    }
  }, [locationType]);

  // Load locations when type changes OR when filter state/city changes
  useEffect(() => {
    // Skip loading all locations if they were already loaded from document
    if (locationsLoadedFromDocument.current) {
      // Don't reset flag here - let it persist until after all initial effects complete
      return;
    }
    
    loadLocations();
  }, [locationType, filterState, filterCity, cpFilterState, cpFilterCity, cpFilterArea]);

  const loadDropdownData = async () => {
    try {
      const [itemsResponse, categoriesResponse, brandsResponse] = await Promise.all([
        itemApi.getItems({ page_size: 1000 }),
        categoryApi.getCategories({ page_size: 1000 }),
        brandApi.getBrands({ page_size: 1000 }),
      ]);
      const sortByName = <T extends { name?: string }>(arr: T[]) =>
        [...arr].sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));

      const sortedItems = sortByName(itemsResponse.results);
      const sortedCategories = sortByName(categoriesResponse.results);
      const sortedBrands = sortByName(brandsResponse.results);
      
      setItems(sortedItems);
      setCategories(sortedCategories);
      setBrands(sortedBrands);
      
      // Reset the document load flags after items are loaded (initial load complete)
      if (locationsLoadedFromDocument.current) {
        locationsLoadedFromDocument.current = false;
        isInitializingFromDocument.current = false;
      }
    } catch (error) {
      toastError('Failed to load dropdown data');
    }
  };

  const loadLocations = async () => {
    try {
      let locationData: Array<State | City | Area | Superstockist | Distributor | Retailer> = [];
      switch (locationType) {
        case 'BASE':
          // For BASE, no locations needed
          locationData = [];
          break;
        case 'STATE':
          const statesResponse = await stateApi.getStates({ page_size: 1000 });
          locationData = statesResponse.results;
          break;
        case 'CITY':
          // Only load cities if state filter is selected
          if (filterState) {
            const citiesResponse = await cityApi.getCities({ page_size: 1000, state: filterState });
            locationData = citiesResponse.results;
          } else {
            locationData = [];
          }
          break;
        case 'AREA':
          // Only load areas if city filter is selected
          if (filterCity) {
            const areasResponse = await areaApi.getAreas({ page_size: 1000, city: filterCity });
            locationData = areasResponse.results;
          } else {
            locationData = [];
          }
          break;
        case 'SUPERSTOCKIST':
          const ssParams = { 
            page_size: 1000,
            ...(cpFilterState && { state: String(cpFilterState.id) }),
            ...(cpFilterCity && { city: String(cpFilterCity.id) }),
            ...(cpFilterArea && { area: String(cpFilterArea.id) }),
          };
          const ssResponse = await superstockistApi.getSuperstockists(ssParams);
          locationData = ssResponse.results;
          break;
        case 'DISTRIBUTOR':
          const distParams = { 
            page_size: 1000,
            ...(cpFilterState && { state: String(cpFilterState.id) }),
            ...(cpFilterCity && { city: String(cpFilterCity.id) }),
            ...(cpFilterArea && { area: String(cpFilterArea.id) }),
          };
          const distResponse = await distributorApi.getDistributors(distParams);
          locationData = distResponse.results;
          break;
        case 'RETAILER':
          const retailerParams = { 
            page_size: 1000,
            ...(cpFilterState && { state: String(cpFilterState.id) }),
            ...(cpFilterCity && { city: String(cpFilterCity.id) }),
            ...(cpFilterArea && { area: String(cpFilterArea.id) }),
          };
          const retailersResponse = await retailerApi.getRetailers(retailerParams);
          locationData = retailersResponse.results;
          break;
        default:
          locationData = [];
      }
      
      // Sort locations by name alphabetically
      const sortedLocations = [...locationData].sort((a, b) => 
        (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
      );
      
      setLocations(sortedLocations);

      // Do not auto-clear selections here; filter effects already reset when user changes filters.
      // Preserves preloaded selections during edit mode.
    } catch (error) {
      toastError('Failed to load locations');
    }
  };

  // Check if user has selected locations from a NEW distributor/source (in edit mode)
  // This enables adding new items for that distributor
  const hasNewLocations = useMemo(() => {
    if (!documentId || gridData.length === 0) return false; // Not in edit mode or no existing data
    
    const originalLocationIds = new Set(gridData.map(cell => cell.locationId).filter(Boolean));
    const newLocationIds = selectedLocations.filter(loc => !originalLocationIds.has(String(loc)));
    
    return newLocationIds.length > 0; // User has selected locations not in original document
  }, [documentId, gridData, selectedLocations]);

  // Selected item ids for filtering
  const selectedItemIds = useMemo(
    () => selectedItemOptions.map((opt) => String(opt.id)),
    [selectedItemOptions]
  );

  // Filter items based on selections
  const filteredItems = useMemo(() => {
    const selectedIdSet = new Set(selectedItemIds);

    const result = items.filter(item => {
      // If items are explicitly selected AND not adding to new distributor, only show those items
      // But if user is adding to a NEW distributor, allow showing items filtered by category/brand
      if (selectedIdSet.size > 0 && !hasNewLocations) {
        return selectedIdSet.has(String(item.id));
      }
      
      // When adding to new distributor/location, allow items not in original selection
      // Apply category and brand filters for discovery
      if (selectedCategories.length > 0 && !selectedCategories.includes(String(item.category || ''))) {
        return false;
      }
      if (selectedBrands.length > 0 && !selectedBrands.includes(String(item.brand || ''))) {
        return false;
      }
      return true;
    });
    
    return result;
  }, [items, selectedItemIds, selectedCategories, selectedBrands, hasNewLocations, documentId]);

  // Paginated items
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredItems.slice(start, end);
  }, [filteredItems, page]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  // Limit locations for performance - show first N locations if none selected
  const displayLocations = useMemo(() => {
    if (locationType === 'BASE') return [];

    // Derived filters for edit mode
    const effectiveFilterState = filterState || (selectedFilterState?.id ? String(selectedFilterState.id) : '');
    const effectiveFilterCity = filterCity || (selectedFilterCity?.id ? String(selectedFilterCity.id) : '');

    // In EDIT MODE: Always include both existing locations (from gridData) and newly selected locations
    // This allows the grid to show all locations when adding to multiple distributors
    if (documentId && gridData.length > 0) {
      const gridLocationIds = [...new Set(gridData.map(cell => cell.locationId).filter(Boolean))];
      const allLocationIds = new Set([...gridLocationIds, ...selectedLocations]);
      return Array.from(allLocationIds).slice(0, MAX_GRID_LOCATIONS);
    }

    // Prefer user selections when present (in create mode)
    if (selectedLocations.length > 0) {
      return selectedLocations;
    }

    // If locations array is empty (e.g., fresh load with no selections), fall back to gridData locationIds
    if (locations.length === 0 && gridData.length > 0) {
      const uniqueIds = [...new Set(gridData.map(cell => cell.locationId).filter(Boolean))];
      return uniqueIds.slice(0, MAX_GRID_LOCATIONS);
    }

    // Otherwise, limit to first MAX_GRID_LOCATIONS for performance
    // For AREA/CITY, respect active filters to avoid full list in edit
    const filteredLocations = locationType === 'AREA'
      ? locations.filter(l => !effectiveFilterCity || String((l as any).city) === effectiveFilterCity || String((l as any).city?.id) === effectiveFilterCity)
      : locationType === 'CITY'
        ? locations.filter(l => !effectiveFilterState || String((l as any).state) === effectiveFilterState || String((l as any).state?.id) === effectiveFilterState)
        : locations;

    const allLocationIds = filteredLocations.map(l => l.id);
    return allLocationIds.slice(0, MAX_GRID_LOCATIONS);
  }, [locationType, selectedLocations, locations, gridData, documentId, filterState, filterCity, selectedFilterState, selectedFilterCity]);

  const hasMoreLocations = locationType !== 'BASE' && 
    selectedLocations.length === 0 && 
    locations.length > MAX_GRID_LOCATIONS;

  // Calculate dynamic column width based on number of locations
  const locationColumnWidth = useMemo(() => {
    if (locationType === 'BASE') return 200;
    const numColumns = displayLocations.length;
    if (numColumns === 0) return 200;
    // Modest widths to balance readability and scroll
    if (numColumns <= 3) return 200;
    if (numColumns <= 6) return 180;
    if (numColumns <= 10) return 160;
    return 140;
  }, [locationType, displayLocations.length]);

  // Sync gridData when filtered items change - remove cells for items no longer in filter
  useEffect(() => {
    if (gridData.length === 0) return;
    // When items are not yet loaded (edit mode pre-load), skip filtering to avoid wiping grid
    if (items.length === 0) return;

    const filteredItemIds = new Set(filteredItems.map(item => item.id));
    const needsFiltering = gridData.some(cell => !filteredItemIds.has(cell.itemId));
    
    if (needsFiltering) {
      setGridData(prevData => prevData.filter(cell => filteredItemIds.has(cell.itemId)));
    } else {
    }
  }, [filteredItems, items.length]);

  // Sync gridData when location selection changes - remove cells for locations no longer selected
  useEffect(() => {
    if (gridData.length === 0 || locationType === 'BASE') return;
    
    // If no locations selected, keep all location cells; otherwise filter to selected only
    if (selectedLocations.length > 0) {
      const selectedLocationSet = new Set(selectedLocations);
      const gridLocationIds = new Set(gridData.map(cell => cell.locationId).filter(Boolean));
      
      // If ALL grid locations are in the selection, this is initial load - skip filtering
      const allGridLocationsInSelection = Array.from(gridLocationIds).every(id => selectedLocationSet.has(id));
      
      if (allGridLocationsInSelection) {
        return;
      }
      
      // Check if ANY cell would be filtered out
      const needsFiltering = gridData.some(cell => cell.locationId && !selectedLocationSet.has(cell.locationId));
      
      if (needsFiltering) {
        setGridData(prevData => prevData.filter(cell => 
          !cell.locationId || selectedLocationSet.has(cell.locationId)
        ));
      }
    }
  }, [selectedLocations, locationType, gridData]);

  // Auto-create grid cells for newly selected items
  // This allows users to immediately add prices for items they just selected
  useEffect(() => {
    if (selectedItemIds.length === 0 || displayLocations.length === 0) {
      return; // No items or locations selected
    }

    const existingCells = new Set(
      gridData.map(cell => `${cell.itemId}-${cell.locationId}`)
    );

    let newCells: GridCell[] = [];

    // For each selected item, create cells for all displayed locations if they don't exist
    for (const itemId of selectedItemIds) {
      for (const locationId of displayLocations) {
        const cellKey = `${itemId}-${locationId}`;
        
        if (!existingCells.has(cellKey)) {
          newCells.push({
            itemId,
            locationId,
            locationType,
            price: '',
            existingPrice: '',
            modified: false,
            errors: [],
          });
        }
      }
    }

    if (newCells.length > 0) {
      setGridData(prevData => [...prevData, ...newCells]);
    }
  }, [selectedItemIds, displayLocations, locationType, gridData]);

  // Load prices for grid
  const handleLoadPrices = async () => {
    setLoading(true);
    setErrors([]);

    // Choose items for payload: use filtered items; if none, fall back to all loaded items
    const itemsForRequest = filteredItems.length > 0 ? filteredItems : items;
    // Build item IDs with fallback to selected item options when items list is not yet loaded
    const itemIds = (itemsForRequest.length > 0
      ? itemsForRequest.map((i) => String(i.id))
      : selectedItemOptions.map((opt) => String(opt.id)));

    // Ensure we have items to load
    if (itemIds.length === 0) {
      setLoading(false);
      toastWarning('No items to load. Please select items or adjust filters.');
      return;
    }

    try {
      // If no locations selected and not BASE, use already loaded locations
      let locationsToUse = selectedLocations;
      if (locationType !== 'BASE' && selectedLocations.length === 0) {
        // Use already loaded and filtered locations from state
        // Apply MAX_GRID_LOCATIONS limit for performance
        const allLocationIds = locations.map(loc => loc.id);
        locationsToUse = allLocationIds.slice(0, MAX_GRID_LOCATIONS);
        setSelectedLocations(locationsToUse);
      }

      // Fetch prices (current + parent) in one optimized call
      const requestBody = {
        location_type: locationType,
        // Use filtered/all items first; if none, fall back to selected item options
        item_ids: itemIds,
        location_ids: locationType === 'BASE' ? [] : locationsToUse.map(String),
        effective_from: effectiveFrom,
        channel_config: {
          enable_superstockist: channelConfig?.enable_superstockist ?? false,
          enable_distributor: channelConfig?.enable_distributor ?? false,
          enable_retailer: channelConfig?.enable_retailer ?? false,
        },
      };


      const priceResponse = await priceBookApi.loadGridWithParents(requestBody);
      const { current_prices = {}, parent_prices = {} } = priceResponse || {};

      // Initialize grid data with parent info
      const cells: GridCell[] = [];

      for (const item of paginatedItems) {
        if (locationType === 'BASE') {
          const key = `${item.id}-`;
          const existingPrice = current_prices[key] || '';
          const parent = parent_prices[key];
          
          cells.push({
            itemId: item.id,
            locationId: '',
            locationType,
            price: existingPrice,
            existingPrice: existingPrice,
            parentPrice: parent?.price,
            parentLevel: parent?.level,
            parentLocationName: parent?.location_name,
            modified: false,
          });
        } else {
          for (const locationId of locationsToUse) {
            const key = `${item.id}-${locationId}`;
            const existingPrice = current_prices[key] || '';
            const parent = parent_prices[key];
            
            cells.push({
              itemId: item.id,
              locationId,
              locationType,
              price: existingPrice,
              existingPrice: existingPrice,
              parentPrice: parent?.price,
              parentLevel: parent?.level,
              parentLocationName: parent?.location_name,
              modified: false,
            });
          }
        }
      }

      setGridData(cells);
      setActiveTab(1); // Switch to grid tab
      
      const cellsWithPrices = cells.filter(c => c.existingPrice).length;
      toastSuccess(`Grid loaded with ${cells.length} entries (${cellsWithPrices} have existing prices)`);
    } catch (error) {
      toastError('Failed to load prices');
    } finally {
      setLoading(false);
    }
  };

  // Apply bulk adjustment
  const handleApplyBulkAdjustment = () => {
    if (!bulkAdjustment || isNaN(parseFloat(bulkAdjustment))) {
      toastWarning('Please enter a valid adjustment value');
      return;
    }

    const adjustment = parseFloat(bulkAdjustment);
    
    setGridData(prevData => 
      prevData.map(cell => {
        if (!cell.existingPrice) return cell;

        const existingPrice = parseFloat(cell.existingPrice);
        let newPrice: number;

        if (bulkType === 'PERCENTAGE') {
          newPrice = bulkDirection === 'INCREASE'
            ? existingPrice * (1 + adjustment / 100)
            : existingPrice * (1 - adjustment / 100);
        } else {
          newPrice = bulkDirection === 'INCREASE'
            ? existingPrice + adjustment
            : existingPrice - adjustment;
        }

        return {
          ...cell,
          price: newPrice.toFixed(2),
          modified: true,
        };
      })
    );

    toastSuccess('Bulk adjustment applied');
  };

  // Update cell value
  const handleCellChange = (itemId: string, locationId: string, field: keyof GridCell, value: string) => {
    setGridData(prevData => {
      // Find existing cell
      const existingIndex = prevData.findIndex(
        cell => cell.itemId === itemId && cell.locationId === locationId
      );

      if (existingIndex >= 0) {
        // Update existing cell
        return prevData.map((cell, idx) => {
          if (idx === existingIndex) {
            const updated = { ...cell, [field]: value, modified: true };
            
            // Validate price
            const errors: string[] = [];
            const price = parseFloat(updated.price || '0');

            if (price < 0) {
              errors.push('Price must be greater than 0');
            }

            updated.errors = errors.length > 0 ? errors : undefined;
            return updated;
          }
          return cell;
        });
      } else {
        // Create new cell for newly selected item
        const newCell: GridCell = {
          itemId,
          locationId,
          locationType,
          price: field === 'price' ? value : '',
          existingPrice: '',
          modified: true,
          errors: [],
        };

        // Validate price if this is a price field
        if (field === 'price') {
          const price = parseFloat(value || '0');
          if (price < 0) {
            newCell.errors = ['Price must be greater than 0'];
          }
        }

        return [...prevData, newCell];
      }
    });
  };

  // Save prices
  const handleSave = async (isDraft: boolean = false) => {
    if (!documentNumber) {
      toastWarning('Document number is required');
      return;
    }

    if (!documentDate) {
      toastWarning('Please select document date');
      return;
    }

    if (!effectiveFrom) {
      toastWarning('Please select effective from date');
      return;
    }

    // Filter only modified cells with values
    const modifiedCells = gridData.filter(
      cell => cell.modified && cell.price
    );

    // Check if there are changes (either grid changes or document field changes)
    if (modifiedCells.length === 0 && !hasDocumentChanges) {
      toastWarning('No changes to save');
      return;
    }

    // Check for validation errors
    const cellsWithErrors = modifiedCells.filter(cell => cell.errors && cell.errors.length > 0);
    if (cellsWithErrors.length > 0) {
      toastError('Please fix validation errors before saving');
      return;
    }

    setSaving(true);
    setErrors([]);

    try {
      // If editing existing document, use update API
      if (documentId) {
        const prices = modifiedCells.map(cell => ({
          item_id: cell.itemId,
          location_id: cell.locationId || null,
          selling_price: cell.price || '0',
        } as any));

        const cpFiltersPayload = ['SUPERSTOCKIST', 'DISTRIBUTOR', 'RETAILER'].includes(locationType)
          ? {
              cp_filter_state: cpFilterState?.id || null,
              cp_filter_city: cpFilterCity?.id || null,
              cp_filter_area: cpFilterArea?.id || null,
            }
          : {
              cp_filter_state: null,
              cp_filter_city: null,
              cp_filter_area: null,
            };

        // Note: bulk_adjustment is intentionally excluded from the payload.
        // The "Apply" button already adjusts prices in the grid, so the
        // prices sent here are final values. Sending bulk_adjustment would
        // cause the backend to apply the adjustment a second time.
        const updateData = {
          document_date: documentDate,
          effective_from: effectiveFrom,
          effective_to: effectiveTo || null,
          remarks: '',
          selected_categories: selectedCategories,
          selected_brands: selectedBrands,
          ...cpFiltersPayload,
          prices: prices.length > 0 ? prices : [],
        };

        const response = await priceBookDocumentApi.updateDocument(documentId, updateData);

        if (response.success) {
          toastSuccess(response.message);
          // Clear modified flags and update original data
          setGridData(prevData => prevData.map(cell => ({ 
            ...cell, 
            modified: false,
            existingPrice: cell.price 
          })));
          setOriginalDocumentData({
            effectiveFrom,
            effectiveTo,
            documentDate,
            cpFilterStateId: cpFilterState ? String(cpFilterState.id) : null,
            cpFilterCityId: cpFilterCity ? String(cpFilterCity.id) : null,
            cpFilterAreaId: cpFilterArea ? String(cpFilterArea.id) : null,
          });
          
          // Invalidate query cache to refresh list
          await queryClient.invalidateQueries({ queryKey: ['priceBookDocuments'] });
          
          // Redirect to list screen after 1.5 seconds
          setTimeout(() => {
            navigate('/price-book');
          }, 1500);
        } else {
          toastError(response.message || 'Update failed');
        }
      } else {
        // Creating new document - use bulk create API
        const prices: BulkPriceBookEntry[] = modifiedCells.map(cell => {
          const entry = {
            item_id: cell.itemId,
            location_id: cell.locationId || null,
            base_price: '0',
            selling_price: cell.price || '0',
            mrp: '0',
            is_active: true,
          } as any;

          return entry;
        });

        const requestData = {
          document_number: documentNumber,
          document_date: documentDate,
          location_type: locationType,
          effective_from: effectiveFrom,
          effective_to: effectiveTo || null,
          save_as_draft: isDraft,
          remarks: '',
          selected_categories: selectedCategories,
          selected_brands: selectedBrands,
          ...(['SUPERSTOCKIST', 'DISTRIBUTOR', 'RETAILER'].includes(locationType)
            ? {
                cp_filter_state: cpFilterState?.id ? String(cpFilterState.id) : null,
                cp_filter_city: cpFilterCity?.id ? String(cpFilterCity.id) : null,
                cp_filter_area: cpFilterArea?.id ? String(cpFilterArea.id) : null,
              }
            : {
                cp_filter_state: null,
                cp_filter_city: null,
                cp_filter_area: null,
              }),
          prices,
        };

        const response = await priceBookApi.bulkCreatePriceBooks(requestData);

        if (response.success) {
          toastSuccess(response.message);
          // Clear modified flags
          setGridData(prevData => prevData.map(cell => ({ ...cell, modified: false })));
          
          // Invalidate query cache to refresh list
          queryClient.invalidateQueries({ queryKey: ['priceBookDocuments'] });
          
          // Redirect to list screen after 1.5 seconds
          setTimeout(() => {
            navigate('/price-book');
          }, 1500);
        } else {
          toastWarning(response.message);
          if (response.errors) {
            setErrors(response.errors.map(e => 
              `Item ${e.item_id}: ${e.error || JSON.stringify(e.errors)}`
            ));
          }
        }
      }
    } catch (error: any) {
      toastError(error.message || 'Failed to save prices');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={getPageContainerStyles()}>
      {/* Fixed Header */}
      <Box sx={getHeaderSectionStyles()}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}>
          {/* Left side - Title with back button */}
          <ScreenHeader
            title="Bulk Price Management"
            showBackButton
            onBack={() => navigate('/price-book')}
            disableBox
          />
          
          {/* Right side - Action buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {(!documentId || documentStatus === 'DRAFT') && (
              <Button
                variant="outlined"
                color="warning"
                startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                onClick={() => handleSave(true)}
                disabled={saving || (gridData.filter(c => c.modified).length === 0 && !hasDocumentChanges)}
                sx={{
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                  },
                }}
              >
                Save as Draft
              </Button>
            )}
            <Button
              variant="contained"
              color="primary"
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={() => handleSave(false)}
              disabled={saving || (gridData.filter(c => c.modified).length === 0 && !hasDocumentChanges)}
            >
              Save All Changes ({gridData.filter(c => c.modified).length})
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Scrollable Content Area */}
      <Box sx={getContentSectionStyles()}>
        {/* Tabs */}
        <Paper sx={{ mb: 2 }}>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab label="Configuration" />
            <Tab label="Price Grid" disabled={gridData.length === 0} />
          </Tabs>
        </Paper>

        {/* Tab 1: Configuration Section */}
        {activeTab === 0 && (
          <Paper sx={{ p: 3, mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: 'primary.main' }}>
              Configuration
            </Typography>
          
          <Grid container spacing={3}>
            {/* Document Number */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                Document Number <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={documentNumber}
                disabled
                sx={{ backgroundColor: '#f5f5f5' }}
              />
            </Grid>

            {/* Document Date */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                Document Date <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
              </Typography>
              <DatePicker
                format="DD-MM-YYYY"
                value={documentDate ? dayjs(documentDate) : null}
                onChange={(date) => setDocumentDate(toDateString(date))}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                    InputLabelProps: { shrink: true },
                  },
                }}
              />
            </Grid>

            {/* Effective Dates */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                Effective From <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
              </Typography>
              <DatePicker
                format="DD-MM-YYYY"
                value={effectiveFrom ? dayjs(effectiveFrom) : null}
                onChange={(date) => setEffectiveFrom(toDateString(date))}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                    InputLabelProps: { shrink: true },
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                Effective To
              </Typography>
              <DatePicker
                format="DD-MM-YYYY"
                value={effectiveTo ? dayjs(effectiveTo) : null}
                onChange={(date) => setEffectiveTo(toDateString(date))}
                minDate={effectiveFrom ? dayjs(effectiveFrom) : undefined}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                    InputLabelProps: { shrink: true },
                  },
                }}
              />
            </Grid>

            {/* Location Type Selection - Radio Buttons & Update Options */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
                Location Type <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                {documentId && <Box component="span" sx={{ ml: 1, fontSize: '0.75rem', color: 'text.secondary' }}>(Cannot be changed when editing)</Box>}
              </Typography>
              <RadioGroup
                row
                value={locationType}
                onChange={(e) => setLocationType(e.target.value as LocationType)}
              >
                <FormControlLabel 
                  value="BASE" 
                  control={<Radio size="small" disabled={!!documentId} />} 
                  label="Base" 
                />
                <FormControlLabel 
                  value="STATE" 
                  control={<Radio size="small" disabled={!!documentId} />} 
                  label="State" 
                />
                <FormControlLabel 
                  value="CITY" 
                  control={<Radio size="small" disabled={!!documentId} />} 
                  label="City" 
                />
                <FormControlLabel 
                  value="AREA" 
                  control={<Radio size="small" disabled={!!documentId} />} 
                  label="Area" 
                />
                {channelConfig?.enable_superstockist && (
                  <FormControlLabel 
                    value="SUPERSTOCKIST" 
                    control={<Radio size="small" disabled={!!documentId} />} 
                    label="Superstockist" 
                  />
                )}
                {channelConfig?.enable_distributor && (
                  <FormControlLabel 
                    value="DISTRIBUTOR" 
                    control={<Radio size="small" disabled={!!documentId} />} 
                    label="Distributor" 
                  />
                )}
                {channelConfig?.enable_retailer && (
                  <FormControlLabel 
                    value="RETAILER" 
                    control={<Radio size="small" disabled={!!documentId} />} 
                    label="Retailer" 
                  />
                )}
              </RadioGroup>
            </Grid>

            {/* Update Mode - Same Line */}
            <Grid size={{ xs: 12, md: 6 }}>
              <RadioGroup
                row
                value={updateMode}
                onChange={(e) => setUpdateMode(e.target.value as UpdateMode)}
              >
                <FormControlLabel value="ITEMWISE" control={<Radio size="small" />} label="Product-wise Entry" />
                <FormControlLabel value="BULK" control={<Radio size="small" />} label="Bulk Adjustment" />
              </RadioGroup>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: 'primary.main' }}>
            Product Filters
          </Typography>

          <Grid container spacing={3}>
            {/* Item Search */}
            {/* Categories */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                Categories
              </Typography>
              <Autocomplete
                multiple
                options={categories}
                getOptionLabel={(option) => option.name}
                value={categories.filter(c => selectedCategories.includes(String(c.id)))}
                onChange={(_, newValue) => setSelectedCategories(newValue.map(v => String(v.id)))}
                size="small"
                componentsProps={{
                  popper: {
                    placement: 'bottom-start',
                    modifiers: [
                      {
                        name: 'flip',
                        enabled: false,
                      },
                    ],
                  },
                }}
                renderInput={(params) => <TextField {...params} placeholder="Select categories" />}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip label={option.name} {...getTagProps({ index })} size="small" />
                  ))
                }
              />
            </Grid>

            {/* Brands */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                Brands
              </Typography>
              <Autocomplete
                multiple
                options={brands}
                getOptionLabel={(option) => option.name}
                value={brands.filter(b => selectedBrands.includes(String(b.id)))}
                onChange={(_, newValue) => setSelectedBrands(newValue.map(v => String(v.id)))}
                size="small"
                componentsProps={{
                  popper: {
                    placement: 'bottom-start',
                    modifiers: [
                      {
                        name: 'flip',
                        enabled: false,
                      },
                    ],
                  },
                }}
                renderInput={(params) => <TextField {...params} placeholder="Select brands" />}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip label={option.name} {...getTagProps({ index })} size="small" />
                  ))
                }
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                Search Products
              </Typography>
              <SearchableDropdown
                label=""
                apiEndpoint={API_ENDPOINTS.ITEMS}
                multiple
                value={selectedItemOptions}
                onChange={(value) => {
                  const options = Array.isArray(value)
                    ? value
                    : value
                      ? [value]
                      : [];
                  setSelectedItemOptions(options);
                }}
                placeholder="Search and select Products"
                additionalFilters={{
                  ...(selectedCategories.length > 0 && { category: selectedCategories.join(',') }),
                  ...(selectedBrands.length > 0 && { brand: selectedBrands.join(',') }),
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                All Products will be displayed if no filters are selected
              </Typography>
              {hasNewLocations && (
                <Alert severity="info" sx={{ mt: 1, py: 1 }}>
                  <Typography variant="caption">
                    You can now add products to the new location(s). Existing products are also available.
                  </Typography>
                </Alert>
              )}
            </Grid>
          </Grid>

          {/* Location Filters for Channel Partners (Optional) */}
          {['SUPERSTOCKIST', 'DISTRIBUTOR', 'RETAILER'].includes(locationType) && (
            <>
              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: 'primary.main' }}>
                {locationType === 'SUPERSTOCKIST' ? 'Superstockist' : locationType === 'DISTRIBUTOR' ? 'Distributor' : 'Retailer'} Filters (Optional)
              </Typography>
              <Alert severity="info" sx={{ mb: 3 }}>
                Use these filters to narrow down {locationType.toLowerCase()} selection by location. These are optional.
              </Alert>

              <Grid container spacing={3}>
                {/* State Filter */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                    Filter by State (Optional)
                  </Typography>
                  <SearchableDropdown
                    label=""
                    apiEndpoint={API_ENDPOINTS.STATES}
                    value={cpFilterState}
                    onChange={(option) => {
                      const singleOption = Array.isArray(option) ? null : option;
                      setCpFilterState(singleOption);
                      // Clear dependent filters
                      setCpFilterCity(null);
                      setCpFilterArea(null);
                      // Clear selected locations to force re-selection with new filter
                      setSelectedLocations([]);
                      setSelectedLocationOptions([]);
                    }}
                    placeholder="All states"
                  />
                </Grid>

                {/* City Filter */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                    Filter by City (Optional)
                  </Typography>
                  <SearchableDropdown
                    label=""
                    apiEndpoint={API_ENDPOINTS.CITIES}
                    value={cpFilterCity}
                    onChange={(option) => {
                      const singleOption = Array.isArray(option) ? null : option;
                      setCpFilterCity(singleOption);
                      // Clear dependent filter
                      setCpFilterArea(null);
                      // Clear selected locations to force re-selection with new filter
                      setSelectedLocations([]);
                      setSelectedLocationOptions([]);
                    }}
                    additionalFilters={{
                      ...(cpFilterState && { state: cpFilterState.id }),
                    }}
                    disabled={!cpFilterState}
                    placeholder={cpFilterState ? "All cities" : "Select state first"}
                  />
                </Grid>

                {/* Area Filter */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                    Filter by Area (Optional)
                  </Typography>
                  <SearchableDropdown
                    label=""
                    apiEndpoint={API_ENDPOINTS.AREAS}
                    value={cpFilterArea}
                    onChange={(option) => {
                      const singleOption = Array.isArray(option) ? null : option;
                      setCpFilterArea(singleOption);
                      // Clear selected locations to force re-selection with new filter
                      setSelectedLocations([]);
                      setSelectedLocationOptions([]);
                    }}
                    additionalFilters={{
                      ...(cpFilterState && { state: cpFilterState.id }),
                      ...(cpFilterCity && { city: cpFilterCity.id }),
                    }}
                    disabled={!cpFilterCity}
                    placeholder={cpFilterCity ? "All areas" : "Select city first"}
                  />
                </Grid>
              </Grid>
            </>
          )}

          {/* Only show Location Selection if not BASE type */}
          {locationType !== 'BASE' && (
            <>
              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: 'primary.main' }}>
                {getLocationSelectionTitle()}
              </Typography>

              <Grid container spacing={3}>
                {/* State Filter - Show for CITY and AREA types */}
                {(locationType === 'CITY' || locationType === 'AREA') && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                      Filter by State <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                    </Typography>
                    <SearchableDropdown
                      key="state-filter"
                      label=""
                      apiEndpoint={API_ENDPOINTS.STATES}
                      value={selectedFilterState}
                      onChange={(option) => {
                        const singleOption = Array.isArray(option) ? null : option;
                        setSelectedFilterState(singleOption);
                        setFilterState(singleOption?.id ? String(singleOption.id) : '');
                        setFilterCity('');
                        setSelectedFilterCity(null);
                      }}
                      error={!filterState}
                      helperText={!filterState ? `Please select a state to load ${locationType === 'CITY' ? 'cities' : 'areas'}` : undefined}
                      placeholder="Select a state"
                    />
                  </Grid>
                )}

                {/* City Filter - Show for AREA type only */}
                {locationType === 'AREA' && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                      Filter by City <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                    </Typography>
                    <SearchableDropdown
                      key={`city-filter-${filterState || 'none'}`}
                      label=""
                      apiEndpoint={API_ENDPOINTS.CITIES}
                      additionalFilters={filterState ? { state: filterState } : undefined}
                      value={selectedFilterCity}
                      onChange={(option) => {
                        const singleOption = Array.isArray(option) ? null : option;
                        setSelectedFilterCity(singleOption);
                        setFilterCity(singleOption?.id ? String(singleOption.id) : '');
                      }}
                      disabled={!filterState}
                      error={!!filterState && !filterCity}
                      helperText={!filterState ? 'Select a state first' : (!filterCity ? 'Please select a city to load areas' : undefined)}
                      placeholder={filterState ? 'Select a city' : 'Select state first'}
                    />
                  </Grid>
                )}

                {/* Locations Selection */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                    {getLocationSelectionLabel()} (Optional - Leave empty to select all)
                  </Typography>
                  <SearchableDropdown
                    key={locationSelectionKey}
                    label=""
                    apiEndpoint={getLocationEndpoint()}
                    multiple
                    value={selectedLocationOptions}
                    onChange={(value) => {
                      const options = Array.isArray(value) ? value : [];
                      setSelectedLocationOptions(options);
                      setSelectedLocations(options.map((opt) => String(opt.id)));
                    }}
                    additionalFilters={locationAdditionalFilters}
                    disabled={
                      (locationType as string) === 'BASE' ||
                      (locationType === 'CITY' && !filterState && !selectedFilterState?.id) ||
                      (locationType === 'AREA' && (
                        (!filterState && !selectedFilterState?.id) ||
                        (!filterCity && !selectedFilterCity?.id)
                      ))
                    }
                    helperText={
                      locationType === 'CITY' && !filterState
                        ? 'Select a state first to enable city selection'
                        : locationType === 'AREA' && !filterState
                          ? 'Select state and city first to enable area selection'
                          : locationType === 'AREA' && filterState && !filterCity
                            ? 'Select a city first to enable area selection'
                            : undefined
                    }
                    placeholder={getLocationSelectionPlaceholder()}
                  />
                </Grid>
              </Grid>
            </>
          )}

          {/* Performance Warning for Excessive Locations */}
          {hasMoreLocations && (
            <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
              <strong>Performance Notice:</strong> Showing first {MAX_GRID_LOCATIONS} of {locations.length} locations.
              To view specific locations, select them using the &quot;Select Locations&quot; dropdown above.
            </Alert>
          )}

          {/* Bulk Adjustment Controls */}
          {updateMode === 'BULK' && (
            <>
              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: 'primary.main' }}>
                Bulk Adjustment
              </Typography>

              <Grid container spacing={3} alignItems="center">
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                    Direction
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={bulkDirection}
                      onChange={(e) => setBulkDirection(e.target.value as 'INCREASE' | 'DECREASE')}
                    >
                      <MenuItem value="INCREASE">Increase ↑</MenuItem>
                      <MenuItem value="DECREASE">Decrease ↓</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                    Adjustment Type
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={bulkType}
                      onChange={(e) => setBulkType(e.target.value as 'AMOUNT' | 'PERCENTAGE')}
                    >
                      <MenuItem value="PERCENTAGE">Percentage %</MenuItem>
                      <MenuItem value="AMOUNT">Amount ₹</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                    Adjustment Value
                  </Typography>
                  <TextField
                    value={bulkAdjustment}
                    onChange={(e) => setBulkAdjustment(e.target.value)}
                    placeholder={bulkType === 'PERCENTAGE' ? '10' : '100'}
                    type="number"
                    fullWidth
                    size="small"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleApplyBulkAdjustment}
                    disabled={!bulkAdjustment}
                    fullWidth
                    sx={{ mt: 3 }}
                  >
                    Apply
                  </Button>
                </Grid>

                {/* Field Visibility */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
                    Show Fields
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    {itemFieldConfig?.selling_price_visible && (
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={fieldVisibility.price}
                            onChange={(e) => setFieldVisibility(prev => ({ ...prev, price: e.target.checked }))}
                          />
                        }
                        label="Price"
                      />
                    )}
                  </Stack>
                </Grid>
              </Grid>
            </>
          )}

          <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
            {/* Validation Warning */}
            {(
              (locationType === 'CITY' && !filterState) ||
              (locationType === 'AREA' && (
                (!filterState && !selectedFilterState?.id) ||
                (!filterCity && !selectedFilterCity?.id)
              ))
            ) && (
              <Alert severity="warning" sx={{ width: '100%', mb: 2 }}>
                {locationType === 'CITY' && !filterState && 
                  'Please select a State to load the price grid with cities.'}
                {locationType === 'AREA' && !filterState && !selectedFilterState?.id && 
                  'Please select State and City to load the price grid with areas.'}
                {locationType === 'AREA' && (filterState || selectedFilterState?.id) && !filterCity && !selectedFilterCity?.id && 
                  'Please select a City to load areas.'}
              </Alert>
            )}
            <Button
              variant="contained"
              size="large"
              startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
              onClick={handleLoadPrices}
              disabled={
                loading || 
                (locationType === 'CITY' && !filterState) ||
                (locationType === 'AREA' && (
                  (!filterState && !selectedFilterState?.id) ||
                  (!filterCity && !selectedFilterCity?.id)
                ))
              }
            >
              Load Price Grid
            </Button>
          </Box>
        </Paper>
        )}

        {/* Tab 2: Grid Section with Filter Summary */}
        {activeTab === 1 && gridData.length > 0 && (
          <>
            {/* Filter Summary - Compact */}
            <Paper sx={{ p: 1.5, mb: 2 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Document:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, ml: 0.5, display: 'inline' }}>{documentNumber}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Type:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, ml: 0.5, display: 'inline' }}>{locationType}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Effective:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, ml: 0.5, display: 'inline' }}>
                    {effectiveFrom ? new Date(effectiveFrom).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-') : ''}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Items:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, ml: 0.5, display: 'inline' }}>{paginatedItems.length}</Typography>
                </Box>
                {locationType !== 'BASE' && locations.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Locations:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, ml: 0.5, display: 'inline' }}>
                      {selectedLocations.length > 0 ? `${selectedLocations.length} selected` : `All (${locations.length})`}
                    </Typography>
                  </Box>
                )}
                
                {/* Active Filters - Inline */}
                {(selectedItemOptions.length > 0 || selectedCategories.length > 0 || selectedBrands.length > 0 || 
                  selectedFilterState || selectedFilterCity || selectedLocations.length > 0) && (
                  <>
                    <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Filters:
                      </Typography>
                      
                      {selectedItemOptions.length > 0 && (
                        <Chip 
                          label={`Products: ${selectedItemOptions.length}`}
                          size="small"
                          sx={{ bgcolor: '#006766', color: 'white', fontWeight: 500, height: 20, fontSize: '0.7rem' }}
                        />
                      )}
                      
                      {selectedCategories.length > 0 && (
                        <Chip 
                          label={`Categories: ${selectedCategories.length}`}
                          size="small"
                          sx={{ bgcolor: '#006766', color: 'white', fontWeight: 500, height: 20, fontSize: '0.7rem' }}
                        />
                      )}
                      
                      {selectedBrands.length > 0 && (
                        <Chip 
                          label={`Brands: ${selectedBrands.length}`}
                          size="small"
                          sx={{ bgcolor: '#006766', color: 'white', fontWeight: 500, height: 20, fontSize: '0.7rem' }}
                        />
                      )}
                      
                      {locationType !== 'BASE' && selectedFilterState && (
                        <Chip 
                          label={`State: ${selectedFilterState.name}`}
                          size="small"
                          sx={{ bgcolor: '#006766', color: 'white', fontWeight: 500, height: 20, fontSize: '0.7rem' }}
                        />
                      )}
                      
                      {locationType === 'AREA' && selectedFilterCity && (
                        <Chip 
                          label={`City: ${selectedFilterCity.name}`}
                          size="small"
                          sx={{ bgcolor: '#006766', color: 'white', fontWeight: 500, height: 20, fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                  </>
                )}
              </Box>
            </Paper>

        {/* Errors Display */}
        {errors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrors([])}>
            <Typography variant="subtitle2" gutterBottom>
              Errors occurred while saving:
            </Typography>
            {errors.map((error, idx) => (
              <Typography key={idx} variant="body2">
                • {error}
              </Typography>
            ))}
          </Alert>
        )}

        {/* Grid Section with Fixed Headers - Flexbox Layout */}
        {gridData.length === 0 ? (
          <Paper sx={{ p: 8, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Grid Loaded
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configure filters above and click "Load Price Grid" to start managing prices
            </Typography>
          </Paper>
        ) : (
          <>
            <Paper sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              height: 'calc(100vh - 320px)',
              overflow: 'hidden',
            }}>
            {/* Fixed Header Container */}
            <Box 
              ref={headerScrollRef}
              sx={{ 
                flexShrink: 0,
                overflowX: 'auto',
                overflowY: 'hidden',
                borderBottom: 2,
                borderColor: 'divider',
                '&::-webkit-scrollbar': { display: 'none' },
                scrollbarWidth: 'none',
              }}
              onScroll={(e) => {
                if (contentScrollRef.current) {
                  contentScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
                }
              }}
            >
              <Box sx={{
                display: 'flex',
                bgcolor: '#006766',
                minWidth: 'max-content',
              }}>
                {/* S.No Header */}
                <Box sx={{ 
                  minWidth: 60, 
                  width: 60,
                  flexShrink: 0,
                  p: 1.5, 
                  borderRight: 1, 
                  borderColor: 'rgba(255, 255, 255, 0.2)', 
                  fontWeight: 'bold',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'sticky',
                  left: 0,
                  bgcolor: '#006766',
                  zIndex: 2,
                  boxShadow: '2px 0 4px rgba(0,0,0,0.1)'
                }}>
                  S.No
                </Box>
                
                {/* Item Header */}
                <Box sx={{ 
                  minWidth: 200, 
                  width: 200,
                  flexShrink: 0,
                  p: 1.5, 
                  borderRight: 1, 
                  borderColor: 'rgba(255, 255, 255, 0.2)', 
                  fontWeight: 'bold',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  position: 'sticky',
                  left: 60,
                  bgcolor: '#006766',
                  zIndex: 2,
                  boxShadow: '2px 0 4px rgba(0,0,0,0.1)'
                }}>
                  Product
                </Box>
                {(locationType === 'BASE' ? ['Base Price'] : displayLocations).map((locationId, idx) => {
                  // Try to find location from selectedLocationOptions first (from dropdown), then fall back to locations array
                  const location = locationType === 'BASE' 
                    ? null 
                    : selectedLocationOptions.find(opt => String(opt.id) === String(locationId)) 
                      || locations.find(l => String(l.id) === String(locationId));

                  const headerLabel = locationType === 'BASE' ? 'Price' : (getLocationName(location) || locationId);

                  return (
                    <Box key={locationId || idx} sx={{ 
                      minWidth: locationColumnWidth, 
                      width: locationColumnWidth,
                      flexShrink: 0,
                      p: 1.5, 
                      borderRight: 1, 
                      borderColor: 'rgba(255, 255, 255, 0.2)', 
                      fontWeight: 'bold',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      lineHeight: 1.3,
                      overflow: 'hidden',
                      wordBreak: 'break-word'
                    }}>
                      <Box sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}>
                        {headerLabel}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>

            {/* Scrollable Content Container - Both Horizontal & Vertical */}
            <Box 
              ref={contentScrollRef}
              sx={{ 
                flex: 1,
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
              }}
              onScroll={(e) => {
                if (headerScrollRef.current) {
                  headerScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
                }
              }}
            >
              <Box sx={{ minWidth: 'max-content' }}>
                {paginatedItems.map((item, index) => (
                  <Box
                    key={item.id}
                    sx={{
                      display: 'flex',
                      borderBottom: 1,
                      borderColor: 'divider',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    {/* S.No - Sticky column */}
                    <Box sx={{ 
                      minWidth: 60,
                      width: 60,
                      flexShrink: 0,
                      p: 1.5, 
                      borderRight: 1, 
                      borderColor: 'divider',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'background.paper',
                      position: 'sticky',
                      left: 0,
                      zIndex: 1,
                      boxShadow: '2px 0 4px rgba(0,0,0,0.1)',
                      fontWeight: 'medium'
                    }}>
                      <Typography variant="body2">
                        {(page - 1) * itemsPerPage + index + 1}
                      </Typography>
                    </Box>
                    
                    {/* Item Name - Sticky column */}
                    <Box sx={{ 
                      minWidth: 200,
                      width: 200,
                      flexShrink: 0,
                      p: 1.5, 
                      borderRight: 1, 
                      borderColor: 'divider',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      bgcolor: 'background.paper',
                      position: 'sticky',
                      left: 60,
                      zIndex: 1,
                      boxShadow: '2px 0 4px rgba(0,0,0,0.1)'
                    }}>
                      <Typography 
                        variant="body2" 
                        fontWeight="medium"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          wordBreak: 'break-word',
                          lineHeight: 1.3
                        }}
                      >
                        {item.name}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          wordBreak: 'break-word'
                        }}
                      >
                        {item.code}
                      </Typography>
                    </Box>

                    {/* Location Cells */}
                    {(locationType === 'BASE' ? [''] : displayLocations).map((locationId) => {
                      const cell = gridData.find(
                        c => c.itemId === item.id && c.locationId === locationId
                      );

                      return (
                        <Box
                          key={`${item.id}-${locationId}`}
                          sx={{
                            minWidth: locationColumnWidth,
                            width: locationColumnWidth,
                            flexShrink: 0,
                            p: 1,
                            borderRight: 1,
                            borderColor: 'divider',
                            bgcolor: cell?.modified ? 'action.selected' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          {fieldVisibility.price && (
                            <Tooltip
                              title={cell?.parentPrice
                                ? `${cell?.parentLevel || 'Parent'}: ${cell?.parentLocationName || ''} - ${cell?.parentPrice}`
                                : 'No parent price'}
                              placement="top"
                              arrow
                            >
                              <TextField
                                size="small"
                                placeholder="Price"
                                value={cell?.price || ''}
                                onChange={(e) => handleCellChange(item.id, locationId, 'price', e.target.value)}
                                type="number"
                                error={cell?.errors && cell.errors.length > 0}
                                helperText={cell?.errors?.[0]}
                                fullWidth
                                sx={{
                                  '& .MuiInputBase-input': {
                                    fontSize: '0.875rem',
                                    padding: '6px 8px',
                                  },
                                  '& .MuiFormHelperText-root': {
                                    fontSize: '0.65rem',
                                    margin: '2px 0 0',
                                  },
                                  '& input[type=number]': {
                                    MozAppearance: 'textfield',
                                  },
                                  '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
                                    WebkitAppearance: 'none',
                                    margin: 0,
                                  }
                                }}
                              />
                            </Tooltip>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                ))}
              </Box>
            </Box>
            </Paper>

            {/* Pagination */}
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
              />
            </Box>
          </>
        )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default PriceBookBulkManage;
