import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  Box,
  MenuItem,
  Tabs,
  Tab,
  Typography,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  Stack,
} from '@mui/material';
import { Close as CloseIcon, LocalOffer as PriceIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import type { PriceBook, PriceBookFormData } from '../../types/masters.types';
import SearchableDropdown from '../common/SearchableDropdown';
import type { DropdownOption } from '../../types/common.types';
import { API_ENDPOINTS } from '../../utils/constants';

interface PriceBookFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PriceBookFormData) => Promise<void>;
  priceBook: PriceBook | null;
  isSubmitting?: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index} style={{ paddingTop: 16 }}>
    {value === index && children}
  </div>
);

const PRICE_BOOK_DEFAULT_VALUES: PriceBookFormData = {
  code: '',
  item_id: '',
  price_type: 'BASE',
  state_id: undefined,
  city_id: undefined,
  area_id: undefined,
  superstockist_id: undefined,
  distributor_id: undefined,
  retailer_id: undefined,
  base_price: 0,
  selling_price: 0,
  mrp: 0,
  discount_percentage: 0,
  effective_from: new Date().toISOString().split('T')[0],
  effective_to: undefined,
  is_active: true,
  remarks: '',
  erp_code: '',
  erp_id: '',
};

const PriceBookFormDialog: React.FC<PriceBookFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  priceBook,
  isSubmitting = false,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedItem, setSelectedItem] = useState<DropdownOption | null>(null);
  const [selectedState, setSelectedState] = useState<DropdownOption | null>(null);
  const [selectedCity, setSelectedCity] = useState<DropdownOption | null>(null);
  const [selectedArea, setSelectedArea] = useState<DropdownOption | null>(null);
  const [selectedSuperstockist, setSelectedSuperstockist] = useState<DropdownOption | null>(null);
  const [selectedDistributor, setSelectedDistributor] = useState<DropdownOption | null>(null);
  const [selectedRetailer, setSelectedRetailer] = useState<DropdownOption | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PriceBookFormData>({
    defaultValues: PRICE_BOOK_DEFAULT_VALUES,
  });

  const priceType = watch('price_type');
  const basePrice = watch('base_price');
  const sellingPrice = watch('selling_price');

  // (SearchableDropdown fetches its own options)

  useEffect(() => {
    if (open && priceBook) {
      reset({
        code: priceBook.code,
        item_id: priceBook.item,
        price_type: priceBook.price_type,
        state_id: priceBook.state,
        city_id: priceBook.city,
        area_id: priceBook.area,
        superstockist_id: priceBook.superstockist,
        distributor_id: priceBook.distributor,
        retailer_id: priceBook.retailer,
        base_price: parseFloat(priceBook.base_price),
        selling_price: parseFloat(priceBook.selling_price),
        mrp: parseFloat(priceBook.mrp),
        discount_percentage: parseFloat(priceBook.discount_percentage),
        effective_from: priceBook.effective_from,
        effective_to: priceBook.effective_to || undefined,
        is_active: priceBook.is_active,
        remarks: priceBook.remarks,
        erp_code: priceBook.erp_code,
        erp_id: priceBook.erp_id,
      });
      setSelectedItem(
        priceBook.item
          ? { id: priceBook.item, name: [priceBook.item_code, priceBook.item_name].filter(Boolean).join(' - ') }
          : null,
      );
      setSelectedState(
        priceBook.state
          ? { id: priceBook.state, name: priceBook.state_name || '' }
          : null,
      );
      setSelectedCity(
        priceBook.city
          ? { id: priceBook.city, name: priceBook.city_name || '' }
          : null,
      );
      setSelectedArea(
        priceBook.area
          ? { id: priceBook.area, name: priceBook.area_name || '' }
          : null,
      );
      setSelectedSuperstockist(
        priceBook.superstockist
          ? { id: priceBook.superstockist, name: priceBook.superstockist_name || '' }
          : null,
      );
      setSelectedDistributor(
        priceBook.distributor
          ? { id: priceBook.distributor, name: priceBook.distributor_name || '' }
          : null,
      );
      setSelectedRetailer(
        priceBook.retailer
          ? { id: priceBook.retailer, name: priceBook.retailer_name || '' }
          : null,
      );
    } else if (open) {
      reset(PRICE_BOOK_DEFAULT_VALUES);
      setSelectedItem(null);
      setSelectedState(null);
      setSelectedCity(null);
      setSelectedArea(null);
      setSelectedSuperstockist(null);
      setSelectedDistributor(null);
      setSelectedRetailer(null);
    }
  }, [open, priceBook, reset]);

  useEffect(() => {
    if (priceType === 'BASE') {
      setValue('state_id', undefined);
      setValue('city_id', undefined);
      setValue('area_id', undefined);
      setValue('superstockist_id', undefined);
      setValue('distributor_id', undefined);
      setValue('retailer_id', undefined);
      setSelectedState(null);
      setSelectedCity(null);
      setSelectedArea(null);
      setSelectedSuperstockist(null);
      setSelectedDistributor(null);
      setSelectedRetailer(null);
    } else if (priceType === 'GEOGRAPHIC') {
      setValue('superstockist_id', undefined);
      setValue('distributor_id', undefined);
      setValue('retailer_id', undefined);
      setSelectedSuperstockist(null);
      setSelectedDistributor(null);
      setSelectedRetailer(null);
    } else if (priceType === 'CHANNEL_PARTNER') {
      setValue('state_id', undefined);
      setValue('city_id', undefined);
      setValue('area_id', undefined);
      setSelectedState(null);
      setSelectedCity(null);
      setSelectedArea(null);
    }
  }, [priceType]);

  // Calculate margin percentage
  const marginPercentage = basePrice > 0 && sellingPrice > 0
    ? (((sellingPrice - basePrice) / basePrice) * 100).toFixed(2)
    : '0.00';

  const handleFormSubmit = async (data: PriceBookFormData) => {
    // Clear scope fields based on price type
    if (data.price_type === 'BASE') {
      data.state_id = undefined;
      data.city_id = undefined;
      data.area_id = undefined;
      data.superstockist_id = undefined;
      data.distributor_id = undefined;
      data.retailer_id = undefined;
    } else if (data.price_type === 'GEOGRAPHIC') {
      data.superstockist_id = undefined;
      data.distributor_id = undefined;
      data.retailer_id = undefined;
    } else if (data.price_type === 'CHANNEL_PARTNER') {
      data.state_id = undefined;
      data.city_id = undefined;
      data.area_id = undefined;
    }

    await onSubmit(data);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset(PRICE_BOOK_DEFAULT_VALUES);
      setTabValue(0);
      setSelectedItem(null);
      setSelectedState(null);
      setSelectedCity(null);
      setSelectedArea(null);
      setSelectedSuperstockist(null);
      setSelectedDistributor(null);
      setSelectedRetailer(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <PriceIcon />
            <span>{priceBook ? 'Edit Price Book' : 'Create Price Book'}</span>
          </Box>
          <IconButton onClick={handleClose} disabled={isSubmitting} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Tabs
        value={tabValue}
        onChange={(_, newValue) => setTabValue(newValue)}
        sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}
      >
        <Tab label="Basic Info" />
        <Tab label="Scope" />
        <Tab label="Pricing" />
        <Tab label="Validity" />
      </Tabs>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent dividers>
          {/* Tab 1: Basic Info */}
          <TabPanel value={tabValue} index={0}>
            <Stack spacing={2}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                {/* <Controller
                  name="code"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Code"
                      fullWidth
                      error={!!errors.code}
                      helperText={errors.code?.message || 'Leave empty for auto-generation'}
                      disabled={!!priceBook}
                      value={field.value?.toUpperCase() || ''}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  )}
                /> */}

                <Controller
                  name="item_id"
                  control={control}
                  rules={{ required: 'Product is required' }}
                  render={({ field: { onChange, value } }) => (
                    <SearchableDropdown
                      label="Product"
                      apiEndpoint={API_ENDPOINTS.ITEMS}
                      value={selectedItem || (value ? { id: value, name: '' } : null)}
                      onChange={(selectedOption: DropdownOption | null) => {
                        setSelectedItem(selectedOption);
                        onChange(selectedOption?.id || undefined);
                      }}
                      error={!!errors.item_id}
                      helperText={errors.item_id?.message}
                      placeholder="Search item"
                    />
                  )}
                />
              </Box>

              <Controller
                name="price_type"
                control={control}
                rules={{ required: 'Price type is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Price Type"
                    fullWidth
                    error={!!errors.price_type}
                    helperText={errors.price_type?.message || 'Select pricing strategy'}
                  >
                    <MenuItem value="BASE">Base Price</MenuItem>
                    <MenuItem value="GEOGRAPHIC">Geographic Pricing</MenuItem>
                    <MenuItem value="CHANNEL_PARTNER">Channel Partner Pricing</MenuItem>
                  </TextField>
                )}
              />

              <Controller
                name="remarks"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Remarks"
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="Additional notes..."
                  />
                )}
              />
            </Stack>
          </TabPanel>

          {/* Tab 2: Scope */}
          <TabPanel value={tabValue} index={1}>
            {priceType === 'BASE' && (
              <Typography color="text.secondary" textAlign="center" py={4}>
                Base price applies to all locations and channels
              </Typography>
            )}

            {priceType === 'GEOGRAPHIC' && (
              <Stack spacing={2}>
                <Typography variant="subtitle2" color="text.secondary">
                  Geographic Scope (Select State → City → Area hierarchy)
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                  <Controller
                    name="state_id"
                    control={control}
                    render={({ field: { onChange } }) => (
                      <SearchableDropdown
                        label="State"
                        apiEndpoint={API_ENDPOINTS.STATES}
                        value={selectedState}
                        onChange={(selectedOption: DropdownOption | null) => {
                          setSelectedState(selectedOption);
                          onChange(selectedOption?.id || undefined);
                          setSelectedCity(null);
                          setSelectedArea(null);
                          setValue('city_id', undefined);
                          setValue('area_id', undefined);
                        }}
                        placeholder="Select a state"
                      />
                    )}
                  />

                  <Controller
                    name="city_id"
                    control={control}
                    render={({ field: { onChange } }) => (
                      <SearchableDropdown
                        label="City"
                        apiEndpoint={API_ENDPOINTS.CITIES}
                        value={selectedCity}
                        onChange={(selectedOption: DropdownOption | null) => {
                          setSelectedCity(selectedOption);
                          onChange(selectedOption?.id || undefined);
                          setSelectedArea(null);
                          setValue('area_id', undefined);
                        }}
                        additionalFilters={selectedState ? { state: selectedState.id } : undefined}
                        disabled={!selectedState}
                        placeholder={selectedState ? 'Select a city' : 'Select state first'}
                      />
                    )}
                  />

                  <Controller
                    name="area_id"
                    control={control}
                    render={({ field: { onChange } }) => (
                      <SearchableDropdown
                        label="Area"
                        apiEndpoint={API_ENDPOINTS.AREAS}
                        value={selectedArea}
                        onChange={(selectedOption: DropdownOption | null) => {
                          setSelectedArea(selectedOption);
                          onChange(selectedOption?.id || undefined);
                        }}
                        additionalFilters={selectedCity ? { city: selectedCity.id } : undefined}
                        disabled={!selectedCity}
                        placeholder={selectedCity ? 'Select a village/town' : 'Select city first'}
                      />
                    )}
                  />
                </Box>
              </Stack>
            )}

            {priceType === 'CHANNEL_PARTNER' && (
              <Stack spacing={2}>
                <Typography variant="subtitle2" color="text.secondary">
                  Channel Partner Scope (Select one: SS → Dist → Retailer)
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                  <Controller
                    name="superstockist_id"
                    control={control}
                    render={({ field: { onChange } }) => (
                      <SearchableDropdown
                        label="Superstockist"
                        apiEndpoint={API_ENDPOINTS.SUPERSTOCKISTS}
                        value={selectedSuperstockist}
                        onChange={(selectedOption: DropdownOption | null) => {
                          setSelectedSuperstockist(selectedOption);
                          onChange(selectedOption?.id || undefined);
                          if (selectedOption) {
                            setSelectedDistributor(null);
                            setSelectedRetailer(null);
                            setValue('distributor_id', undefined);
                            setValue('retailer_id', undefined);
                          }
                        }}
                        placeholder="Select a superstockist"
                      />
                    )}
                  />

                  <Controller
                    name="distributor_id"
                    control={control}
                    render={({ field: { onChange } }) => (
                      <SearchableDropdown
                        label="Distributor"
                        apiEndpoint={API_ENDPOINTS.DISTRIBUTORS}
                        value={selectedDistributor}
                        onChange={(selectedOption: DropdownOption | null) => {
                          setSelectedDistributor(selectedOption);
                          onChange(selectedOption?.id || undefined);
                          if (selectedOption) {
                            setSelectedSuperstockist(null);
                            setSelectedRetailer(null);
                            setValue('superstockist_id', undefined);
                            setValue('retailer_id', undefined);
                          }
                        }}
                        placeholder="Select a distributor"
                      />
                    )}
                  />

                  <Controller
                    name="retailer_id"
                    control={control}
                    render={({ field: { onChange } }) => (
                      <SearchableDropdown
                        label="Retailer"
                        apiEndpoint={API_ENDPOINTS.RETAILERS}
                        value={selectedRetailer}
                        onChange={(selectedOption: DropdownOption | null) => {
                          setSelectedRetailer(selectedOption);
                          onChange(selectedOption?.id || undefined);
                          if (selectedOption) {
                            setSelectedSuperstockist(null);
                            setSelectedDistributor(null);
                            setValue('superstockist_id', undefined);
                            setValue('distributor_id', undefined);
                          }
                        }}
                        placeholder="Select a retailer"
                      />
                    )}
                  />
                </Box>
              </Stack>
            )}
          </TabPanel>

          {/* Tab 3: Pricing */}
          <TabPanel value={tabValue} index={2}>
            <Stack spacing={2}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                <Controller
                  name="base_price"
                  control={control}
                  rules={{ 
                    required: 'Base price is required',
                    min: { value: 0, message: 'Must be >= 0' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="number"
                      label="Base Price"
                      fullWidth
                      error={!!errors.base_price}
                      helperText={errors.base_price?.message}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      }}
                    />
                  )}
                />

                <Controller
                  name="selling_price"
                  control={control}
                  rules={{ 
                    required: 'Selling price is required',
                    min: { value: 0, message: 'Must be >= 0' },
                    validate: (value) => 
                      value >= basePrice || 'Must be >= Base Price'
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="number"
                      label="Selling Price"
                      fullWidth
                      error={!!errors.selling_price}
                      helperText={errors.selling_price?.message}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      }}
                    />
                  )}
                />

                <Controller
                  name="mrp"
                  control={control}
                  rules={{ 
                    required: 'MRP is required',
                    min: { value: 0, message: 'Must be >= 0' },
                    validate: (value) => 
                      value >= sellingPrice || 'Must be >= Selling Price'
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="number"
                      label="MRP"
                      fullWidth
                      error={!!errors.mrp}
                      helperText={errors.mrp?.message}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      }}
                    />
                  )}
                />

                <Controller
                  name="discount_percentage"
                  control={control}
                  rules={{ 
                    min: { value: 0, message: 'Must be >= 0' },
                    max: { value: 100, message: 'Must be <= 100' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="number"
                      label="Discount %"
                      fullWidth
                      error={!!errors.discount_percentage}
                      helperText={errors.discount_percentage?.message}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      }}
                    />
                  )}
                />
              </Box>

              <Box p={2} bgcolor="grey.100" borderRadius={1}>
                <Typography variant="body2" color="text.secondary">
                  Margin: <strong>{marginPercentage}%</strong> | 
                  Profit: <strong>₹{(sellingPrice - basePrice).toFixed(2)}</strong>
                </Typography>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                <Controller
                  name="erp_code"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="ERP Code"
                      fullWidth
                      placeholder="Optional"
                    />
                  )}
                />

                <Controller
                  name="erp_id"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="ERP ID"
                      fullWidth
                      placeholder="Optional"
                    />
                  )}
                />
              </Box>
            </Stack>
          </TabPanel>

          {/* Tab 4: Validity */}
          <TabPanel value={tabValue} index={3}>
            <Stack spacing={2}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                <Controller
                  name="effective_from"
                  control={control}
                  rules={{ required: 'Effective from date is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="date"
                      label="Effective From"
                      fullWidth
                      error={!!errors.effective_from}
                      helperText={errors.effective_from?.message}
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />

                <Controller
                  name="effective_to"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="date"
                      label="Effective To"
                      fullWidth
                      helperText="Leave blank for indefinite"
                      InputLabelProps={{ shrink: true }}
                      value={field.value || ''}
                    />
                  )}
                />
              </Box>

              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        {...field}
                        checked={field.value}
                      />
                    }
                    label="Is Active"
                  />
                )}
              />
            </Stack>
          </TabPanel>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : priceBook ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PriceBookFormDialog;
