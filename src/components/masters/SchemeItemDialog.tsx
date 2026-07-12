import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
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
import type { SchemeItem } from '../../types/masters.types';

interface SchemeItemDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (item: Partial<SchemeItem>) => void;
  schemeItem?: Partial<SchemeItem>;
}

const SchemeItemDialog: React.FC<SchemeItemDialogProps> = ({
  open,
  onClose,
  onSave,
  schemeItem,
}) => {
  const { control, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<Partial<SchemeItem>>({
    defaultValues: schemeItem || {
      include_all_items: false,
    },
  });

  const includeAllItems = watch('include_all_items');
  const selectedCategory = watch('category');
  const [selectedCategoryOption, setSelectedCategoryOption] = useState<DropdownOption | null>(null);
  const [selectedItemOption, setSelectedItemOption] = useState<DropdownOption | null>(null);

  useEffect(() => {
    if (!open) return;
    if (schemeItem) {
      reset(schemeItem);
      setSelectedCategoryOption(
        schemeItem.category
          ? { id: schemeItem.category, name: schemeItem.category_name || '' }
          : null
      );
      setSelectedItemOption(
        schemeItem.item
          ? { id: schemeItem.item, name: schemeItem.item_name || '' }
          : null
      );
      return;
    }

    reset({
      include_all_items: false,
      category: undefined,
      item: undefined,
    });
    setSelectedCategoryOption(null);
    setSelectedItemOption(null);
  }, [open, reset, schemeItem]);

  // Build item API endpoint with category filter
  const selectedCategoryId = selectedCategoryOption?.id || selectedCategory;
  const itemApiEndpoint = selectedCategoryId 
    ? `${API_ENDPOINTS.ITEMS}?category=${selectedCategoryId}`
    : API_ENDPOINTS.ITEMS;

  const handleFormSubmit = (data: Partial<SchemeItem>) => {
    const enrichedData: Partial<SchemeItem> = {
      ...data,
      category_name: selectedCategoryOption?.name,
      item_name: selectedItemOption?.name,
    };
    onSave(enrichedData);
    onClose();
  };

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
        {schemeItem ? 'Edit Product' : 'Add Product'}
        <IconButton aria-label="close" onClick={handleClose} size="small" sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent sx={{ py: 1 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <Controller
                name="include_all_items"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label="Include all products"
                  />
                )}
              />
            </Grid>

            {!includeAllItems && (
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
                    Product
                  </Typography>
                  <Controller
                    name="item"
                    control={control}
                    render={({ field }) => (
                      <SearchableDropdown
                        label=""
                        apiEndpoint={itemApiEndpoint}
                        value={selectedItemOption}
                        onChange={(option: DropdownOption | null) => {
                          setSelectedItemOption(option);
                          field.onChange(option?.id);
                        }}
                        placeholder="Select product"
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

export default SchemeItemDialog;
