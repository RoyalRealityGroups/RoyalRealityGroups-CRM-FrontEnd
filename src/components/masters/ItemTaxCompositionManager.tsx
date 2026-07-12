import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Stack,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Close as CloseIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useQuery } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { taxApi } from '../../api/masters.api';
import { formatDate, toDateString } from '../../utils/format';
import dayjs from 'dayjs';
import type { ItemTaxComposition } from '../../types/masters.types';

interface ItemTaxCompositionManagerProps {
  itemId?: string;
  existingCompositions?: ItemTaxComposition[];
  disabled?: boolean;
  onCompositionsChange?: (compositions: any[]) => void;
  initialCompositions?: any[];
}

interface TaxCompositionFormData {
  tax: string;
  composition_type: 'PRIMARY' | 'CESS';
  effective_from: string;
  effective_to?: string;
}

const ItemTaxCompositionManager: React.FC<ItemTaxCompositionManagerProps> = ({
  itemId,
  existingCompositions = [],
  disabled = false,
  onCompositionsChange,
  initialCompositions = [],
}) => {
  const [open, setOpen] = useState(false);
  const [editingComposition, setEditingComposition] = useState<any | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [localCompositions, setLocalCompositions] = useState<any[]>(initialCompositions);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', onConfirm: () => {} });

  const { control, handleSubmit, reset, watch, formState: { errors }, setError, clearErrors } = useForm<TaxCompositionFormData>({
    defaultValues: {
      tax: '',
      composition_type: 'PRIMARY',
      effective_from: '',
      effective_to: '',
    },
  });

  const watchedCompositionType = watch('composition_type');
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

  // Fetch all taxes for dropdown
  const { data: taxes, isLoading: taxesLoading } = useQuery({
    queryKey: ['taxes', 'mini'],
    queryFn: () => taxApi.getTaxesMini(),
  });

  // Memoize filtered taxes to prevent re-computation on every render
  const filteredTaxes = useMemo(() => {
    if (!taxes) return [];
    return taxes.filter((tax: any) => {
      if (watchedCompositionType === 'PRIMARY') {
        return tax.tax_type === 'GST';
      } else {
        return tax.tax_type === 'CESS' || tax.tax_type === 'COMPENSATION_CESS';
      }
    });
  }, [taxes, watchedCompositionType]);

  // Initialize from existing compositions when editing an item
  useEffect(() => {
    if (itemId && existingCompositions && existingCompositions.length > 0) {
      setLocalCompositions(existingCompositions);
      onCompositionsChange?.(existingCompositions);
    }
  }, [itemId, existingCompositions]);

  // Always use local state for display
  const displayCompositions = localCompositions;

  const handleOpen = useCallback((composition?: any, index?: number) => {
    if (composition) {
      setEditingComposition(composition);
      setEditingIndex(index ?? null);
      reset({
        tax: composition.tax?.id || composition.tax,
        composition_type: composition.composition_type,
        effective_from: composition.effective_from,
        effective_to: composition.effective_to || '',
      });
    } else {
      setEditingComposition(null);
      setEditingIndex(null);
      reset({
        tax: '',
        composition_type: 'PRIMARY',
        effective_from: new Date().toISOString().split('T')[0],
        effective_to: '',
      });
    }
    setOpen(true);
  }, [reset]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setEditingComposition(null);
    setEditingIndex(null);
    reset();
  }, [reset]);

  const onSubmit = async (data: TaxCompositionFormData) => {
    const selectedTax = taxes?.find((t: any) => t.id === data.tax);
    if (!selectedTax) return;

    // Check for conflicts with existing compositions
    const conflicts = localCompositions.filter((comp, index) => {
      if (index === editingIndex) return false; // Skip current editing item
      return (
        comp.composition_type === data.composition_type &&
        (!comp.effective_to || !data.effective_to) // At least one is ongoing
      );
    });

    if (conflicts.length > 0) {
      const conflict = conflicts[0];
      const conflictTax = taxes?.find((t: any) => t.id === conflict.tax) || 
                         taxes?.find((t: any) => t.id === conflict.tax?.id);
      
      // If we can't find the tax in the dropdown, get it from the conflict object itself
      const conflictTaxInfo = conflictTax || {
        name: conflict.tax?.name || conflict.tax_name || 'Unknown Tax',
        tax_rate: conflict.tax?.tax_rate || 'Unknown Rate'
      };
      
      // Check if same tax
      if (conflict.tax === data.tax || conflict.tax?.id === data.tax) {
        alert(`A tax composition for "${selectedTax.name}" already exists and is ongoing. You cannot add the same tax again.`);
        return;
      }
      
      // Check if same rate
      if (conflictTaxInfo && conflictTaxInfo.tax_rate === selectedTax.tax_rate) {
        alert(`A tax composition with rate ${selectedTax.tax_rate}% already exists for ${data.composition_type} type. Please use a different tax rate.`);
        return;
      }
      
      // Different tax, different rate - ask for confirmation
      setConfirmDialog({
        open: true,
        title: 'Replace Existing Tax Composition',
        message: `An ongoing ${data.composition_type} tax composition exists (${conflictTaxInfo.name} - ${conflictTaxInfo.tax_rate}%). Do you want to replace it with "${selectedTax.name} - ${selectedTax.tax_rate}%"?`,
        onConfirm: () => handleConfirmedSubmit(data, conflict)
      });
      return;
    }

    // No conflicts, proceed normally
    handleConfirmedSubmit(data);
  };

  const handleConfirmedSubmit = (data: TaxCompositionFormData, conflictToReplace?: any) => {
    const newCompositions = [...localCompositions];
    const formattedData = {
      ...data,
      effective_to: data.effective_to || null,
    };

    // If replacing a conflict, set its effective_to to one day before new effective_from
    if (conflictToReplace) {
      const conflictIndex = localCompositions.findIndex(comp => 
        comp.tax === conflictToReplace.tax && 
        comp.composition_type === conflictToReplace.composition_type
      );
      
      if (conflictIndex !== -1) {
        const newEffectiveFrom = new Date(data.effective_from);
        const previousDay = new Date(newEffectiveFrom);
        previousDay.setDate(previousDay.getDate() - 1);
        
        newCompositions[conflictIndex] = {
          ...newCompositions[conflictIndex],
          effective_to: previousDay.toISOString().split('T')[0]
        };
      }
    }

    if (editingIndex !== null) {
      // Update existing
      newCompositions[editingIndex] = {
        ...editingComposition,
        ...formattedData,
      };
    } else {
      // Add new
      newCompositions.push(formattedData);
    }
    
    setLocalCompositions(newCompositions);
    onCompositionsChange?.(newCompositions);
    handleClose();
    setConfirmDialog({ open: false, title: '', message: '', onConfirm: () => {} });
  };

  const handleDelete = async (index: number) => {
    if (!window.confirm('Are you sure you want to delete this tax composition?')) {
      return;
    }

    // Delete from local state - will be saved with item
    const newCompositions = localCompositions.filter((_, i) => i !== index);
    setLocalCompositions(newCompositions);
    onCompositionsChange?.(newCompositions);
  };

  // Get tax name by ID for display
  const getTaxName = useCallback((taxId: string) => {
    const tax = taxes?.find((t: any) => t.id === taxId);
    return tax?.name || taxId;
  }, [taxes]);

  // Get tax rate by ID for display
  const getTaxRate = useCallback((taxId: string) => {
    const tax = taxes?.find((t: any) => t.id === taxId);
    return tax?.tax_rate || 0;
  }, [taxes]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
          Tax Composition
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
          disabled={disabled}
          size="small"
        >
          Add Tax Composition
        </Button>
      </Box>

      {displayCompositions && displayCompositions.length > 0 ? (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600 }}>Tax</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Rate</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Effective From</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Effective To</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayCompositions.map((composition: any, index: number) => (
                <TableRow key={composition.id || index} hover>
                  <TableCell>
                    {composition.tax?.name || composition.tax_name || getTaxName(composition.tax)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={composition.composition_type}
                      color={composition.composition_type === 'PRIMARY' ? 'primary' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {composition.tax?.tax_rate || getTaxRate(composition.tax)}%
                  </TableCell>
                  <TableCell>{formatDate(composition.effective_from)}</TableCell>
                  <TableCell>{composition.effective_to ? formatDate(composition.effective_to) : 'Ongoing'}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpen(composition, index)}
                      disabled={disabled}
                      color="primary"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(index)}
                      disabled={disabled}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
          <Typography variant="body2">
            No tax compositions added yet. Click "Add Tax Composition" to create one.
          </Typography>
        </Paper>
      )}

      {/* Add/Edit Dialog */}
      <Dialog 
        open={open} 
        onClose={(_event, reason) => {
          if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
            return;
          }
          handleClose();
        }}
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {editingComposition ? 'Edit Tax Composition' : 'Add Tax Composition'}
          <IconButton
            aria-label="close"
            onClick={handleClose}
            size="small"
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent sx={{ py: 1 }}>
            <Stack spacing={2}>
              {/* Composition Type Field */}
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Composition Type <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <Controller
                  name="composition_type"
                  control={control}
                  rules={{ required: 'Composition type is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      error={!!errors.composition_type}
                      helperText={errors.composition_type?.message}
                      sx={{ '& .MuiInputBase-root': { height: 42, borderRadius: 1 } }}
                    >
                      <MenuItem value="PRIMARY">PRIMARY (GST)</MenuItem>
                      <MenuItem value="CESS">CESS</MenuItem>
                    </TextField>
                  )}
                />
              </Box>

              {/* Tax Field */}
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Tax <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <Controller
                  name="tax"
                  control={control}
                  rules={{ required: 'Tax is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      error={!!errors.tax}
                      helperText={errors.tax?.message}
                      disabled={taxesLoading}
                      sx={{ '& .MuiInputBase-root': { height: 42, borderRadius: 1 } }}
                    >
                      {filteredTaxes.length === 0 ? (
                        <MenuItem disabled>
                          {taxesLoading ? 'Loading...' : `No ${watchedCompositionType} taxes available`}
                        </MenuItem>
                      ) : (
                        filteredTaxes.map((tax: any) => (
                          <MenuItem key={tax.id} value={tax.id}>
                            {tax.name} - {tax.tax_rate}% ({tax.tax_type})
                          </MenuItem>
                        ))
                      )}
                    </TextField>
                  )}
                />
              </Box>

              {/* Effective From Field */}
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Effective From <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
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

              {/* Effective To Field */}
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                >
                  Effective To
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
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: 'small',
                          error: !!errors.effective_to,
                          helperText: errors.effective_to?.message || 'Leave empty for ongoing',
                        },
                      }}
                    />
                  )}
                />
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'flex-end' }}>
            <Button onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              {editingComposition ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} maxWidth="sm" fullWidth>
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <Typography>{confirmDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, title: '', message: '', onConfirm: () => {} })}>
            Cancel
          </Button>
          <Button 
            onClick={confirmDialog.onConfirm} 
            variant="contained" 
            color="primary"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ItemTaxCompositionManager;