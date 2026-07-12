import React, { useState, useEffect } from 'react';
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
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { uomApi } from '../../api/masters.api';
import type { ItemUOMConversion, ItemUOMConversionFormData } from '../../types/masters.types';

interface ItemUOMConversionManagerProps {
  itemId?: string;
  existingConversions?: ItemUOMConversion[];
  disabled?: boolean;
  onConversionsChange?: (conversions: any[]) => void;
  initialConversions?: any[];
  baseUOM?: string;
}

const ItemUOMConversionManager: React.FC<ItemUOMConversionManagerProps> = ({ 
  itemId, 
  existingConversions = [],
  disabled = false,
  onConversionsChange,
  initialConversions = [],
  baseUOM,
}) => {
  const [open, setOpen] = useState(false);
  const [editingConversion, setEditingConversion] = useState<any | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [localConversions, setLocalConversions] = useState<any[]>(initialConversions);

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<ItemUOMConversionFormData>({
    defaultValues: {
      alternate_uom: '',
      conversion_factor: 1,
    },
  });

  // Initialize from existing conversions when editing an item
  useEffect(() => {
    if (itemId && existingConversions && existingConversions.length > 0 && localConversions.length === 0) {
      // Filter out base UOM from display (it's auto-created by backend)
      const nonBaseConversions = existingConversions.filter(c => c.alternate_uom !== baseUOM);
      setLocalConversions(nonBaseConversions);
      // Send conversions to parent for form state
      onConversionsChange?.(nonBaseConversions);
    }
  }, [itemId, existingConversions, baseUOM, onConversionsChange]);

  // Always use local state for display
  const displayConversions = localConversions;

  // Fetch all UOMs for dropdown
  const { data: uoms, isLoading: uomsLoading } = useQuery({
    queryKey: ['uoms', 'mini'],
    queryFn: () => uomApi.getUOMMini(),
  });

  const handleOpen = (conversion?: ItemUOMConversion, index?: number) => {
    if (conversion) {
      setEditingConversion(conversion);
      setEditingIndex(index ?? null);
      reset({
        alternate_uom: conversion.alternate_uom,
        conversion_factor: conversion.conversion_factor,
      });
    } else {
      setEditingConversion(null);
      setEditingIndex(null);
      reset({
        alternate_uom: '',
        conversion_factor: 1,
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingConversion(null);
    setEditingIndex(null);
    reset();
  };

  const onSubmit = async (data: ItemUOMConversionFormData) => {
    // Check for duplicate alternate UOM
    const isDuplicate = localConversions.some((c, index) => c.alternate_uom === data.alternate_uom && index !== editingIndex);
    
    if (isDuplicate) {
      alert('This alternate UOM is already added for this item. Please select a different UOM.');
      return;
    }

    // Always save to local state - will be sent with item save
    const newConversions = [...localConversions];
    if (editingIndex !== null) {
      // Update existing - preserve ID if it exists
      newConversions[editingIndex] = {
        ...editingConversion,
        ...data
      };
    } else {
      // Add new
      newConversions.push(data);
    }
    setLocalConversions(newConversions);
    onConversionsChange?.(newConversions);
    handleClose();
  };

  const handleDelete = async (index: number) => {
    if (!window.confirm('Are you sure you want to delete this UOM conversion?')) {
      return;
    }

    // Delete from local state - will be saved with item
    const newConversions = localConversions.filter((_, i) => i !== index);
    setLocalConversions(newConversions);
    onConversionsChange?.(newConversions);
  };

  // Get UOM name by ID for display in local conversions
  const getUOMName = (uomId: string) => {
    return uoms?.find((u: any) => u.id === uomId)?.name || uomId;
  };

  // Watch the selected alternate UOM and conversion factor to display dynamic helper text
  const selectedAlternateUOM = watch('alternate_uom');
  const conversionFactorValue = watch('conversion_factor');
  
  // Get conversion helper text with actual UOM names and conversion factor
  const getConversionHelperText = () => {
    const alternateUOMName = selectedAlternateUOM ? getUOMName(selectedAlternateUOM) : 'Alternate UOM';
    const baseUOMName = baseUOM ? getUOMName(baseUOM) : 'Base UOM';
    const factor = conversionFactorValue || 'X';
    return `1 ${alternateUOMName} = ${factor} ${baseUOMName}`;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
          Unit of Measure Conversions
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
          disabled={disabled}
          size="small"
        >
          Add Conversion
        </Button>
      </Box>

      {displayConversions && displayConversions.length > 0 ? (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600 }}>Alternate UOM</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Conversion Factor</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayConversions.map((conversion: any, index: number) => (
                <TableRow key={conversion.id || index} hover>
                  <TableCell>
                    {conversion.alternate_uom_name || getUOMName(conversion.alternate_uom)}
                  </TableCell>
                  <TableCell>{conversion.conversion_factor}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpen(conversion, index)}
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
            No UOM conversions added yet. Click "Add Conversion" to create one.
          </Typography>
        </Paper>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingConversion ? 'Edit UOM Conversion' : 'Add UOM Conversion'}
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600 }}>
                  Alternate UOM <Box component="span" sx={{ color: '#f44336' }}>*</Box>
                </Typography>
                <Controller
                  name="alternate_uom"
                  control={control}
                  rules={{ required: 'Alternate UOM is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      error={!!errors.alternate_uom}
                      helperText={errors.alternate_uom?.message}
                      disabled={uomsLoading}
                      sx={{ '& .MuiOutlinedInput-root': { height: 42 } }}
                    >
                      {uomsLoading ? (
                        <MenuItem disabled>
                          <CircularProgress size={20} />
                        </MenuItem>
                      ) : (
                        uoms?.filter((uom: any) => uom.id !== baseUOM).map((uom: any) => (
                          <MenuItem key={uom.id} value={uom.id}>
                            {uom.name}
                          </MenuItem>
                        ))
                      )}
                    </TextField>
                  )}
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600 }}>
                  Conversion Factor <Box component="span" sx={{ color: '#f44336' }}>*</Box>
                </Typography>
                <Controller
                  name="conversion_factor"
                  control={control}
                  rules={{
                    required: 'Conversion factor is required',
                    min: { value: 0.0001, message: 'Must be greater than 0' },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? '' : parseFloat(e.target.value);
                        field.onChange(value);
                      }}
                      type="number"
                      fullWidth
                      inputProps={{ step: 0.0001, min: 0.0001 }}
                      error={!!errors.conversion_factor}
                      helperText={errors.conversion_factor?.message || getConversionHelperText()}
                      sx={{ '& .MuiOutlinedInput-root': { height: 42 } }}
                    />
                  )}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
            >
              {editingConversion ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default ItemUOMConversionManager;
