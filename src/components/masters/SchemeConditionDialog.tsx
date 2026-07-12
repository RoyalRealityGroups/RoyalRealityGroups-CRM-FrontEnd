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
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import SearchableDropdown from '../common/SearchableDropdown';
import { API_ENDPOINTS } from '../../utils/constants';
import type { DropdownOption } from '../../types/common.types';
import type { SchemeCondition } from '../../types/masters.types';

interface SchemeConditionDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (condition: Partial<SchemeCondition>) => void;
  condition?: Partial<SchemeCondition>;
  conditionTypeOptions?: DropdownOption[];
}

const SchemeConditionDialog: React.FC<SchemeConditionDialogProps> = ({
  open,
  onClose,
  onSave,
  condition,
  conditionTypeOptions = [],
}) => {
  const { control, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<Partial<SchemeCondition>>({
    defaultValues: condition || {},
  });

  const conditionType = watch('condition_type');
  const selectedCategory = watch('category');
  const [selectedCategoryOption, setSelectedCategoryOption] = useState<DropdownOption | null>(null);
  const [selectedItemOption, setSelectedItemOption] = useState<DropdownOption | null>(null);
  const [selectedItemOptions, setSelectedItemOptions] = useState<DropdownOption[]>([]);

  useEffect(() => {
    if (!open) return;
    if (condition) {
      reset(condition);
      setSelectedCategoryOption(
        condition.category
          ? { id: condition.category, name: condition.category_name || '' }
          : null
      );
      setSelectedItemOption(
        condition.item
          ? { id: condition.item, name: condition.item_name || '' }
          : null
      );
      // Restore multi-select items for ITEM_COMBO
      if (condition.items && Array.isArray(condition.items)) {
        const itemNames = condition.items_display || [];
        setSelectedItemOptions(
          condition.items.map((id: string, idx: number) => ({
            id,
            name: itemNames[idx] || String(id),
          }))
        );
      } else if (condition.item) {
        setSelectedItemOptions([{ id: condition.item, name: condition.item_name || '' }]);
      } else {
        setSelectedItemOptions([]);
      }
      return;
    }

    reset({
      condition_type: undefined,
      value_from: undefined,
      value_to: undefined,
      category: undefined,
      item: undefined,
    });
    setSelectedCategoryOption(null);
    setSelectedItemOption(null);
    setSelectedItemOptions([]);
  }, [condition, conditionTypeOptions, open, reset]);

  const handleFormSubmit = (data: Partial<SchemeCondition>) => {
    const isCombo = data.condition_type === 'ITEM_COMBO';
    const enrichedData: Partial<SchemeCondition> & { items?: string[]; items_display?: string[] } = {
      ...data,
      category_name: selectedCategoryOption?.name,
    };
    if (isCombo && selectedItemOptions.length > 0) {
      enrichedData.items = selectedItemOptions.map(o => String(o.id));
      enrichedData.items_display = selectedItemOptions.map(o => o.name);
      enrichedData.item = String(selectedItemOptions[0].id);
      enrichedData.item_name = selectedItemOptions.map(o => o.name).join(', ');
    } else {
      enrichedData.item_name = selectedItemOption?.name;
    }
    onSave(enrichedData);
    onClose();
  };

  const showValueFrom = [
    'MIN_QUANTITY',
    'MIN_VALUE',
    'MAX_QUANTITY',
    'MAX_VALUE',
    'EXACT_QUANTITY',
    'QUANTITY_RANGE',
    'VALUE_RANGE',
  ].includes(conditionType || '');
  const showValueTo = ['QUANTITY_RANGE', 'VALUE_RANGE'].includes(conditionType || '');
  const showCategoryItem = ['ITEM_COMBO'].includes(conditionType || '');

  const valueFromLabel = (() => {
    switch (conditionType) {
      case 'MIN_QUANTITY':
        return 'Minimum Quantity';
      case 'MIN_VALUE':
        return 'Minimum Value';
      case 'MAX_QUANTITY':
        return 'Maximum Quantity';
      case 'MAX_VALUE':
        return 'Maximum Value';
      case 'EXACT_QUANTITY':
        return 'Exact Quantity';
      default:
        return showValueTo ? 'Value From' : 'Value';
    }
  })();
  
  // Build item API endpoint with category filter
  const selectedCategoryId = selectedCategoryOption?.id || selectedCategory;
  const itemApiEndpoint = selectedCategoryId 
    ? `${API_ENDPOINTS.ITEMS}?category=${selectedCategoryId}`
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
        {condition ? 'Edit Condition' : 'Add Condition'}
        <IconButton aria-label="close" onClick={handleClose} size="small" sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent sx={{ py: 1 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                Condition Type <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
              </Typography>
              <Controller
                name="condition_type"
                control={control}
                rules={{ required: 'Condition type is required' }}
                render={({ field }) => (
                  <SearchableDropdown
                    label=""
                    apiEndpoint=""
                    staticOptions={conditionTypeOptions}
                    value={conditionTypeOptions.find(t => t.id === field.value) || null}
                    onChange={(option: DropdownOption | null) => field.onChange(option?.id)}
                    error={!!errors.condition_type}
                    helperText={errors.condition_type?.message}
                    placeholder="Select condition type"
                  />
                )}
              />
            </Grid>

            {showValueFrom && (
              <Grid size={{ xs: 12, sm: showValueTo ? 6 : 12 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                  {valueFromLabel} <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <Controller
                  name="value_from"
                  control={control}
                  rules={{ required: 'Value is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="number"
                      fullWidth
                      placeholder="Enter value"
                      error={!!errors.value_from}
                      helperText={errors.value_from?.message}
                      sx={{ '& .MuiInputBase-root': { height: 42, borderRadius: 1 } }}
                    />
                  )}
                />
              </Grid>
            )}

            {showValueTo && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                  Value To <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <Controller
                  name="value_to"
                  control={control}
                  rules={{ required: 'Value To is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="number"
                      fullWidth
                      placeholder="Enter value"
                      error={!!errors.value_to}
                      helperText={errors.value_to?.message}
                      sx={{ '& .MuiInputBase-root': { height: 42, borderRadius: 1 } }}
                    />
                  )}
                />
              </Grid>
            )}

            {showCategoryItem && (
              <>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                    Category
                  </Typography>
                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <SearchableDropdown
                        label=""
                        apiEndpoint={API_ENDPOINTS.CATEGORIES}
                        value={selectedCategoryOption}
                        onChange={(option: DropdownOption | null) => {
                          setSelectedCategoryOption(option);
                          field.onChange(option?.id);
                          setSelectedItemOption(null);
                          setValue('item', undefined);
                        }}
                        placeholder="Select category"
                      />
                    )}
                  />
                </Grid>
                
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                    Products
                  </Typography>
                  <Controller
                    name="item"
                    control={control}
                    render={({ field }) => (
                      <SearchableDropdown
                        label=""
                        apiEndpoint={itemApiEndpoint}
                        multiple
                        value={selectedItemOptions}
                        onChange={(value) => {
                          const options = Array.isArray(value) ? value : value ? [value] : [];
                          setSelectedItemOptions(options);
                          field.onChange(options.length > 0 ? String(options[0].id) : undefined);
                        }}
                        placeholder="Select products"
                        disabled={!selectedCategoryId}
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

export default SchemeConditionDialog;
