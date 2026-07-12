import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  FormControlLabel,
  Checkbox,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import SearchableDropdown from '../common/SearchableDropdown';
import { API_ENDPOINTS } from '../../utils/constants';
import type { DropdownOption } from '../../types/common.types';
import type { SchemeBenefit } from '../../types/masters.types';

interface SchemeBenefitDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (benefit: Partial<SchemeBenefit>) => void;
  benefit?: Partial<SchemeBenefit>;
  benefitTypeOptions?: DropdownOption[];
  schemeType?: string;
}

const SchemeBenefitDialog: React.FC<SchemeBenefitDialogProps> = ({
  open,
  onClose,
  onSave,
  benefit,
  benefitTypeOptions = [],
  schemeType,
}) => {
  const { control, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<Partial<SchemeBenefit>>({
    defaultValues: benefit || {
      apply_to_all: false,
    },
  });

  const benefitType = watch('benefit_type');
  const applyToAll = watch('apply_to_all');
  const selectedApplyToCategory = watch('apply_to_category');
  const [selectedFreeItemOption, setSelectedFreeItemOption] = useState<DropdownOption | null>(null);
  const [selectedApplyToCategoryOption, setSelectedApplyToCategoryOption] = useState<DropdownOption | null>(null);
  const [selectedApplyToItemOption, setSelectedApplyToItemOption] = useState<DropdownOption | null>(null);

  useEffect(() => {
    if (!open) return;
    if (benefit) {
      reset(benefit);
      setSelectedFreeItemOption(
        benefit.free_item
          ? { id: benefit.free_item, name: benefit.free_item_name || '' }
          : null
      );
      const applyToCategoryId = (benefit as Partial<SchemeBenefit> & { apply_to_category?: string }).apply_to_category;
      const applyToCategoryName = (benefit as Partial<SchemeBenefit> & { apply_to_category_name?: string }).apply_to_category_name;
      setSelectedApplyToCategoryOption(
        applyToCategoryId
          ? { id: applyToCategoryId, name: applyToCategoryName || '' }
          : null
      );
      setSelectedApplyToItemOption(
        benefit.apply_to_item
          ? { id: benefit.apply_to_item, name: benefit.apply_to_item_name || '' }
          : null
      );
      return;
    }

    reset({
      benefit_type: undefined,
      apply_to_all: false,
      discount_value: undefined,
      max_discount_amount: undefined,
      free_item: undefined,
      free_quantity: undefined,
      apply_to_category: undefined,
      apply_to_item: undefined,
    });
    setSelectedFreeItemOption(null);
    setSelectedApplyToCategoryOption(null);
    setSelectedApplyToItemOption(null);
  }, [benefit, benefitTypeOptions, open, reset]);

  const [applyError, setApplyError] = useState<string | null>(null);

  const handleFormSubmit = (data: Partial<SchemeBenefit>) => {
    if (!isCombo && !data.apply_to_all && !selectedApplyToCategoryOption?.id && !selectedApplyToItemOption?.id) {
      setApplyError('Please select "Apply to all", or choose a category or product.');
      return;
    }
    setApplyError(null);
    const enrichedData: Partial<SchemeBenefit> & { apply_to_category_name?: string } = {
      ...data,
      free_item_name: selectedFreeItemOption?.name,
      apply_to_item_name: selectedApplyToItemOption?.name,
      apply_to_category_name: selectedApplyToCategoryOption?.name,
    };
    onSave(enrichedData);
    onClose();
  };

  const isCombo = schemeType === 'COMBO';

  const showDiscountValue = ['DISCOUNT_PERCENTAGE', 'DISCOUNT_AMOUNT', 'CASHBACK'].includes(benefitType || '');
  const showFreeItem = ['FREE_ITEM'].includes(benefitType || '');
  const showFreeQuantity = ['FREE_QUANTITY', 'FREE_ITEM'].includes(benefitType || '');
  
  // Build item API endpoint with category filter for apply_to_item
  const selectedApplyToCategoryId = selectedApplyToCategoryOption?.id || selectedApplyToCategory;
  const applyToItemApiEndpoint = selectedApplyToCategoryId 
    ? `${API_ENDPOINTS.ITEMS}?category=${selectedApplyToCategoryId}`
    : API_ENDPOINTS.ITEMS;

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={(_event, reason) => {
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
          return;
        }
        handleClose();
      }}
      maxWidth="md" 
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {benefit ? 'Edit Benefit' : 'Add Benefit'}
        <IconButton aria-label="close" onClick={handleClose} size="small" sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent sx={{ py: 1 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                Benefit Type <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
              </Typography>
              <Controller
                name="benefit_type"
                control={control}
                rules={{ required: 'Benefit type is required' }}
                render={({ field }) => (
                  <SearchableDropdown
                    label=""
                    apiEndpoint=""
                    staticOptions={benefitTypeOptions}
                    value={benefitTypeOptions.find(t => t.id === field.value) || null}
                    onChange={(option: DropdownOption | null) => field.onChange(option?.id)}
                    error={!!errors.benefit_type}
                    helperText={errors.benefit_type?.message}
                    placeholder="Select benefit type"
                  />
                )}
              />
            </Grid>

            {showDiscountValue && (
              <>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                    Discount Value <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                  </Typography>
                  <Controller
                    name="discount_value"
                    control={control}
                    rules={{ required: 'Discount value is required' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        type="number"
                        fullWidth
                        placeholder={benefitType === 'DISCOUNT_PERCENTAGE' ? 'Enter %' : 'Enter amount'}
                        error={!!errors.discount_value}
                        helperText={errors.discount_value?.message}
                        sx={{ '& .MuiInputBase-root': { height: 42, borderRadius: 1 } }}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                    Max Discount Amount
                  </Typography>
                  <Controller
                    name="max_discount_amount"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        type="number"
                        fullWidth
                        placeholder="Optional cap"
                        sx={{ '& .MuiInputBase-root': { height: 42, borderRadius: 1 } }}
                      />
                    )}
                  />
                </Grid>
              </>
            )}

            {showFreeItem && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                  Free Product <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <Controller
                  name="free_item"
                  control={control}
                  rules={{ required: 'Free product is required' }}
                  render={({ field }) => (
                    <SearchableDropdown
                      label=""
                      apiEndpoint={API_ENDPOINTS.ITEMS}
                      value={selectedFreeItemOption}
                      onChange={(option: DropdownOption | null) => {
                        setSelectedFreeItemOption(option);
                        field.onChange(option?.id);
                      }}
                      error={!!errors.free_item}
                      helperText={errors.free_item?.message}
                      placeholder="Select free product"
                    />
                  )}
                />
              </Grid>
            )}

            {showFreeQuantity && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                  Free Quantity <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <Controller
                  name="free_quantity"
                  control={control}
                  rules={{ required: 'Free quantity is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="number"
                      fullWidth
                      placeholder="Enter quantity"
                      error={!!errors.free_quantity}
                      helperText={errors.free_quantity?.message}
                      sx={{ '& .MuiInputBase-root': { height: 42, borderRadius: 1 } }}
                    />
                  )}
                />
              </Grid>
            )}

            {!isCombo && (
            <Grid size={{ xs: 12 }}>
              <Controller
                name="apply_to_all"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label="Apply to all products in order"
                  />
                )}
              />
            </Grid>
            )}

            {applyError && !applyToAll && (
              <Grid size={{ xs: 12 }}>
                <Typography variant="body2" color="error">{applyError}</Typography>
              </Grid>
            )}

            {!isCombo && !applyToAll && (
              <>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                    Apply to Category <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                  </Typography>
                  <Controller
                    name="apply_to_category"
                    control={control}
                    render={({ field }) => (
                      <SearchableDropdown
                        label=""
                        apiEndpoint={API_ENDPOINTS.CATEGORIES}
                        value={selectedApplyToCategoryOption}
                        onChange={(option: DropdownOption | null) => {
                          setSelectedApplyToCategoryOption(option);
                          field.onChange(option?.id);
                          setSelectedApplyToItemOption(null);
                          setValue('apply_to_item', undefined);
                        }}
                        placeholder="Select category"
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                    Apply to Products
                  </Typography>
                  <Controller
                    name="apply_to_item"
                    control={control}
                    render={({ field }) => (
                      <SearchableDropdown
                        label=""
                        apiEndpoint={applyToItemApiEndpoint}
                        value={selectedApplyToItemOption}
                        onChange={(option: DropdownOption | null) => {
                          setSelectedApplyToItemOption(option);
                          field.onChange(option?.id);
                        }}
                        placeholder="Select Product"
                        disabled={!selectedApplyToCategoryId}
                      />
                    )}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'flex-end' }}>
          <Button onClick={handleClose} variant="outlined" color="secondary">
            Cancel
          </Button>
          <Button type="submit" variant="contained">
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default SchemeBenefitDialog;
