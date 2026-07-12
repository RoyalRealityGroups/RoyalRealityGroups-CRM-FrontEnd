import React, { useEffect, useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { itemApi, taxApi } from '../../api/masters.api';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { toDateString } from '../../utils/format';
import type {
  Item,
  ItemTaxComposition,
  ItemTaxCompositionFormData,
  Tax,
} from '../../types/masters.types';

interface ItemTaxCompositionFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ItemTaxCompositionFormData) => Promise<void>;
  composition: ItemTaxComposition | null;
  isSubmitting?: boolean;
}

type ItemOption = Pick<Item, 'id' | 'code' | 'name'>;

const getDefaultValues = (): ItemTaxCompositionFormData => ({
  item: '',
  tax: '',
  composition_type: 'PRIMARY',
  effective_from: dayjs().format('YYYY-MM-DD'),
  effective_to: null,
});

const ItemTaxCompositionFormDialog: React.FC<ItemTaxCompositionFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  composition,
  isSubmitting = false,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<ItemTaxCompositionFormData>({
    defaultValues: getDefaultValues(),
  });

  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [debouncedItemSearch, setDebouncedItemSearch] = useState('');
  const [itemInputValue, setItemInputValue] = useState('');
  const [selectedItemOption, setSelectedItemOption] = useState<ItemOption | null>(null);
  const watchedCompositionType = watch('composition_type');
  const watchedItemId = watch('item');
  const watchedEffectiveFrom = watch('effective_from');
  const watchedEffectiveTo = watch('effective_to');

  // Validate effective_to is not less than effective_from
  useEffect(() => {
    if (watchedEffectiveFrom && watchedEffectiveTo) {
      if (dayjs(watchedEffectiveTo).isBefore(dayjs(watchedEffectiveFrom))) {
        setError('effective_to', {
          type: 'manual',
          message: 'Effective To date cannot be before Effective From date',
        });
      } else {
        clearErrors('effective_to');
      }
    }
  }, [watchedEffectiveFrom, watchedEffectiveTo, setError, clearErrors]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedItemSearch(itemSearchTerm), 300);
    return () => clearTimeout(timer);
  }, [itemSearchTerm]);

  // Fetch items for autocomplete
  const { data: itemsData, isLoading: itemsLoading } = useQuery({
    queryKey: ['items', debouncedItemSearch],
    queryFn: () => itemApi.getItems({ search: debouncedItemSearch || undefined, page_size: 50 }),
    enabled: open,
  });

  // Fetch taxes for dropdown
  const { data: taxesData, isLoading: taxesLoading } = useQuery({
    queryKey: ['taxes'],
    queryFn: () => taxApi.getTaxes({ page_size: 100 }),
    enabled: open,
  });

  useEffect(() => {
    if (open) {
      if (composition) {
        reset({
          item: composition.item,
          tax: composition.tax.id,
          composition_type: composition.composition_type,
          effective_from: composition.effective_from,
          effective_to: composition.effective_to,
        });
        const prefilledOption: ItemOption = {
          id: composition.item,
          code: composition.item_name,
          name: composition.item_name,
        };
        setSelectedItemOption(prefilledOption);
        setItemInputValue(prefilledOption.code ? `${prefilledOption.code} - ${prefilledOption.name}` : prefilledOption.name);
      } else {
        reset(getDefaultValues());
        setSelectedItemOption(null);
        setItemInputValue('');
      }
    } else {
      reset(getDefaultValues());
      setSelectedItemOption(null);
      setItemSearchTerm('');
      setItemInputValue('');
      setDebouncedItemSearch('');
    }
  }, [open, composition, reset]);

  // Keep a stable selected option even when search results change
  useEffect(() => {
    if (!watchedItemId) {
      setSelectedItemOption(null);
      return;
    }

    const match = itemsData?.results?.find((item: Item) => item.id === watchedItemId);
    if (match && match.id !== selectedItemOption?.id) {
      setSelectedItemOption({ id: match.id, code: match.code, name: match.name });
      setItemInputValue(`${match.code} - ${match.name}`);
    }
  }, [watchedItemId, itemsData?.results, itemsLoading, selectedItemOption?.id]);

  const itemOptions = useMemo(() => {
    const options = (itemsData?.results as Item[] | undefined) || [];
    if (selectedItemOption && !options.some((item) => item.id === selectedItemOption.id)) {
      return [selectedItemOption, ...options];
    }
    return options;
  }, [itemsData?.results, selectedItemOption]);

  const handleFormSubmit = async (data: ItemTaxCompositionFormData) => {
    await onSubmit(data);
    reset(getDefaultValues());
    setSelectedItemOption(null);
    setItemSearchTerm('');
    setItemInputValue('');
    setDebouncedItemSearch('');
  };

  const handleClose = () => {
    if (isSubmitting) return;
    reset(getDefaultValues());
    setSelectedItemOption(null);
    setItemSearchTerm('');
    setItemInputValue('');
    setDebouncedItemSearch('');
    onClose();
  };

  // Filter taxes based on composition type - memoized to prevent re-calculation
  const filteredTaxes = useMemo(() => {
    if (!taxesData?.results) return [];
    
    return taxesData.results.filter((tax: Tax) => {
      if (watchedCompositionType === 'PRIMARY') {
        return tax.tax_type === 'GST' && !tax.is_cess;
      } else if (watchedCompositionType === 'CESS') {
        return tax.is_cess || tax.tax_type === 'CESS' || tax.tax_type === 'COMPENSATION_CESS';
      }
      return true;
    });
  }, [taxesData?.results, watchedCompositionType]);

  return (
    <Dialog
        open={open}
        onClose={(_event, reason) => {
          if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
          handleClose();
        }}
        maxWidth="md"
        fullWidth
        disableEscapeKeyDown={isSubmitting}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {composition ? 'Edit product Tax Composition' : 'Add New product Tax Composition'}
          <IconButton edge="end" onClick={handleClose} disabled={isSubmitting} aria-label="close">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogContent sx={{ py: 1 }}>
            <Box sx={{ pt: 1 }}>
              {/* Item Selection */}
              <Box sx={{ mb: 2.5 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600 }}>
                  Product <Box component="span" sx={{ color: '#f44336' }}>*</Box>
                </Typography>
                <Controller
                  name="item"
                  control={control}
                  rules={{ required: 'Product is required' }}
                  render={({ field: { onChange } }) => (
                    <Autocomplete
                      value={selectedItemOption}
                      onChange={(_event, newValue) => {
                        onChange(newValue?.id || '');
                        if (newValue) {
                          setSelectedItemOption({ id: newValue.id, code: newValue.code, name: newValue.name });
                          setItemInputValue(`${newValue.code} - ${newValue.name}`);
                        } else {
                          setSelectedItemOption(null);
                          setItemInputValue('');
                        }
                        setItemSearchTerm('');
                        setDebouncedItemSearch('');
                      }}
                      inputValue={itemInputValue}
                      onInputChange={(_event, newInputValue, reason) => {
                        setItemInputValue(newInputValue);
                        if (reason === 'input') {
                          setItemSearchTerm(newInputValue);
                        }
                      }}
                      options={itemOptions}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      getOptionLabel={(option) => `${option.code} - ${option.name}`}
                      loading={itemsLoading}
                      disabled={isSubmitting || !!composition}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Search products..."
                          sx={{ '& .MuiOutlinedInput-root': { height: 42 } }}
                          error={!!errors.item}
                          helperText={errors.item?.message}
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {itemsLoading ? <CircularProgress size={20} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                    />
                  )}
                />
              </Box>

              {/* Composition Type and Tax in a row */}
              <Box sx={{ display: 'flex', gap: 2.5, mb: 2.5 }}>
                {/* Composition Type */}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600 }}>
                    Composition Type <Box component="span" sx={{ color: '#f44336' }}>*</Box>
                  </Typography>
                  <Controller
                    name="composition_type"
                    control={control}
                    rules={{ required: 'Composition type is required' }}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.composition_type} disabled={isSubmitting}>
                        <Select 
                          {...field} 
                          sx={{ height: 42 }}
                        >
                          <MenuItem value="PRIMARY">PRIMARY (GST)</MenuItem>
                          <MenuItem value="CESS">CESS (Compensation)</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  />
                  {errors.composition_type && (
                    <Typography variant="caption" color="error">
                      {errors.composition_type.message}
                    </Typography>
                  )}
                </Box>

                {/* Tax Selection */}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600 }}>
                    Tax <Box component="span" sx={{ color: '#f44336' }}>*</Box>
                  </Typography>
                  <Controller
                    name="tax"
                    control={control}
                    rules={{ required: 'Tax is required' }}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.tax} disabled={isSubmitting || taxesLoading}>
                        <Select {...field} sx={{ height: 42 }}>
                          {filteredTaxes.length === 0 ? (
                            <MenuItem disabled>
                              {taxesLoading ? 'Loading...' : `No ${watchedCompositionType} taxes available`}
                            </MenuItem>
                          ) : (
                            filteredTaxes.map((tax: Tax) => (
                              <MenuItem key={tax.id} value={tax.id}>
                                {tax.name} ({tax.tax_rate}%)
                              </MenuItem>
                            ))
                          )}
                        </Select>
                      </FormControl>
                    )}
                  />
                  {errors.tax && (
                    <Typography variant="caption" color="error">
                      {errors.tax.message}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Effective From and To in a row */}
              <Box sx={{ display: 'flex', gap: 2.5, mb: 2.5 }}>
                {/* Effective From */}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600 }}>
                    Effective From <Box component="span" sx={{ color: '#f44336' }}>*</Box>
                  </Typography>
                  <Controller
                    name="effective_from"
                    control={control}
                    rules={{ required: 'Effective from date is required' }}
                    render={({ field }) => (
                      <DatePicker
                        format="DD-MM-YYYY"
                        value={field.value ? dayjs(field.value) : null}
                        onChange={(date) => field.onChange(toDateString(date) || '')}
                        disabled={isSubmitting}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: 'small',
                            error: !!errors.effective_from,
                            helperText: errors.effective_from?.message,
                          },
                        }}
                      />
                    )}
                  />
                </Box>

                {/* Effective To */}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600 }}>
                    Effective To <Box component="span" sx={{ color: '#888', fontSize: '0.85em' }}>(Optional)</Box>
                  </Typography>
                  <Controller
                    name="effective_to"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        format="DD-MM-YYYY"
                        value={field.value ? dayjs(field.value) : null}
                        onChange={(date) => field.onChange(toDateString(date) || null)}
                        minDate={watchedEffectiveFrom ? dayjs(watchedEffectiveFrom) : undefined}
                        disabled={isSubmitting}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: 'small',
                            // placeholder: 'Leave empty for current',
                            error: !!errors.effective_to,
                            helperText: errors.effective_to?.message || '',
                          },
                        }}
                      />
                    )}
                  />
                </Box>
              </Box>

              {/* Info Box */}
              <Box sx={{ p: 2, bgcolor: 'info.lighter', borderRadius: 1, border: 1, borderColor: 'info.light' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Important Notes:
                </Typography>
                <Typography variant="body2" component="ul" sx={{ pl: 2, m: 0 }}>
                  <li>Only ONE PRIMARY (GST) tax allowed per product per date range</li>
                  <li>Multiple CESS taxes can be added to a product</li>
                  <li>Leave "Effective To" empty to make it current (no end date)</li>
                  <li>Effective dates help track tax changes over time</li>
                </Typography>
              </Box>
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting || taxesLoading || itemsLoading}
            >
              {isSubmitting ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  {composition ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                composition ? 'Update' : 'Create'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
  );
};

export default ItemTaxCompositionFormDialog;
