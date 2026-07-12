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
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog as ConfirmDialog,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Close as CloseIcon,
  LocalOffer as SchemeIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import type {
  Scheme,
  SchemeFormData,
  SchemeCondition,
  SchemeBenefit,
  SchemeApplicability,
  SchemeItem,
} from '../../types/masters.types';
import SearchableDropdown from '../common/SearchableDropdown';
import type { DropdownOption } from '../../types/common.types';
import { API_ENDPOINTS } from '../../utils/constants';
import apiClient from '../../api/axios.config';
import dayjs from 'dayjs';
import { toDateString } from '../../utils/format';

interface SchemeFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: SchemeFormData) => Promise<void>;
  scheme: Scheme | null;
  isSubmitting?: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface RelatedItemEditorProps {
  type: 'condition' | 'benefit' | 'applicability' | 'item';
  items: any[];
  onAdd: (item: any) => void;
  onEdit: (index: number, item: any) => void;
  onDelete: (index: number) => void;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index} style={{ paddingTop: 16 }}>
    {value === index && children}
  </div>
);

const SCHEME_DEFAULT_VALUES: SchemeFormData = {
  code: '',
  name: '',
  description: '',
  type: '',
  status: 'DRAFT',
  priority: 0,
  company: '',
  effective_from: new Date().toISOString().split('T')[0],
  effective_to: undefined,
  conditions: [],
  benefits: [],
  applicability: [],
  items: [],
};

const SCHEME_STATUSES: Array<{ value: any; label: string }> = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'EXPIRED', label: 'Expired' },
];

const CONDITION_OPERATORS: Array<{ value: string; label: string }> = [
  { value: 'AND', label: 'All conditions must match (AND)' },
  { value: 'OR', label: 'Any condition can match (OR)' },
];

const formatDisplayValue = (value: any) =>
  value === null || value === undefined || value === '' ? '—' : value;

const SummaryItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <Box sx={{ minWidth: 0 }}>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', wordBreak: 'break-word' }}>
      {value}
    </Typography>
  </Box>
);

const SchemeSummary: React.FC<{
  schemeTypeLabel: string;
  schemeName: string;
  schemeCode: string;
  statusLabel: string;
  effectiveRange: string;
  priorityValue: string | number;
}> = ({
  schemeTypeLabel,
  schemeName,
  schemeCode,
  statusLabel,
  effectiveRange,
  priorityValue,
}) => (
  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, minmax(0, 1fr))' },
        gap: 1.5,
      }}
    >
      <SummaryItem label="Scheme Type" value={schemeTypeLabel} />
      <SummaryItem label="Scheme Name" value={schemeName} />
      <SummaryItem label="Scheme Code" value={schemeCode} />
      <SummaryItem label="Status" value={statusLabel} />
      <SummaryItem label="Effective Dates" value={effectiveRange} />
      <SummaryItem label="Priority" value={priorityValue} />
    </Box>
  </Paper>
);

const SchemeFormDialog: React.FC<SchemeFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  scheme,
  isSubmitting = false,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [conditions, setConditions] = useState<Partial<SchemeCondition>[]>([]);
  const [conditionsOperator, setConditionsOperator] = useState<string>('');
  const [benefits, setBenefits] = useState<Partial<SchemeBenefit>[]>([]);
  const [applicability, setApplicability] = useState<Partial<SchemeApplicability>[]>([]);
  const [items, setItems] = useState<Partial<SchemeItem>[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<DropdownOption | null>(null);
  const [editorDialog, setEditorDialog] = useState(false);
  const [editorType, setEditorType] = useState<'condition' | 'benefit' | 'applicability' | 'item' | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const { data: schemeChoices } = useQuery({
    queryKey: ['scheme-choices'],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.SCHEMES_CHOICES);
      return response.data;
    },
  });

  const schemeTypeOptions: Array<{ value: string; label: string }> = (
    schemeChoices?.scheme_types || []
  ).map((option: { id: string; name: string }) => ({
    value: option.id,
    label: option.name,
  }));

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<SchemeFormData>({
    defaultValues: SCHEME_DEFAULT_VALUES,
  });

  const summaryValues = watch([
    'code',
    'name',
    'type',
    'status',
    'effective_from',
    'effective_to',
    'priority',
  ]);

  const [
    summaryCode,
    summaryName,
    summaryType,
    summaryStatus,
    summaryEffectiveFrom,
    summaryEffectiveTo,
    summaryPriority,
  ] = summaryValues;

  const schemeTypeLabel = formatDisplayValue(
    schemeTypeOptions.find((option) => option.value === summaryType)?.label || summaryType
  );
  const statusLabel = formatDisplayValue(
    SCHEME_STATUSES.find((option) => option.value === summaryStatus)?.label || summaryStatus
  );
  const effectiveRange = formatDisplayValue(
    summaryEffectiveFrom || summaryEffectiveTo
      ? `${formatDisplayValue(summaryEffectiveFrom)} to ${summaryEffectiveTo || 'Open'}`
      : ''
  );
  const priorityValue = formatDisplayValue(summaryPriority);
  const schemeNameDisplay = formatDisplayValue(summaryName);
  const schemeCodeDisplay = formatDisplayValue(summaryCode);

  useEffect(() => {
    if (open && scheme) {
      reset({
        code: scheme.code,
        name: scheme.name,
        description: scheme.description || '',
        type: scheme.type || (scheme as any).scheme_type,
        status: scheme.status,
        priority: scheme.priority,
        company: scheme.company || '',
        effective_from: scheme.effective_from,
        effective_to: scheme.effective_to || undefined,
        conditions: scheme.conditions || [],
        benefits: scheme.benefits || [],
        applicability: scheme.applicability || [],
        items: scheme.items || [],
      });
      setSelectedCompany(
        scheme.company
          ? { id: scheme.company, name: scheme.company_name || '' }
          : null
      );
      setConditions(scheme.conditions || []);
      setConditionsOperator(
        (scheme.conditions && scheme.conditions[0]?.logical_operator) || ''
      );
      setBenefits(scheme.benefits || []);
      setApplicability(scheme.applicability || []);
      setItems(scheme.items || []);
    } else if (open) {
      reset(SCHEME_DEFAULT_VALUES);
      setConditions([]);
      setSelectedCompany(null);
      setConditionsOperator('');
      setBenefits([]);
      setApplicability([]);
      setItems([]);
    }
  }, [open, scheme, reset]);

  const handleFormSubmit = async (data: SchemeFormData) => {
    if (conditions.length > 1 && !conditionsOperator) {
      setTabValue(1);
      return;
    }

    const normalizedConditions = conditions.map((condition) => (
      conditionsOperator ? { ...condition, logical_operator: conditionsOperator } : condition
    ));

    const { type, ...rest } = data;
    const submitData = {
      ...rest,
      scheme_type: type,
      conditions: normalizedConditions,
      benefits,
      applicability,
      items,
    };
    await onSubmit(submitData as any);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset(SCHEME_DEFAULT_VALUES);
      setTabValue(0);
      setConditions([]);
      setConditionsOperator('');
      setBenefits([]);
      setApplicability([]);
      setItems([]);
      setEditorDialog(false);
      setEditorType(null);
      setEditingIndex(null);
      onClose();
    }
  };

  const handleAddCondition = () => {
    setEditorType('condition');
    setEditingIndex(null);
    setEditorDialog(true);
  };

  const handleDeleteCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const handleDeleteBenefit = (index: number) => {
    setBenefits(benefits.filter((_, i) => i !== index));
  };

  const handleDeleteApplicability = (index: number) => {
    setApplicability(applicability.filter((_, i) => i !== index));
  };

  const handleDeleteItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <SchemeIcon />
            <span>{scheme ? 'Edit Scheme' : 'Create Scheme'}</span>
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
        <Tab label="Conditions" />
        <Tab label="Benefits" />
        <Tab label="Applicability" />
        <Tab label="Items" />
      </Tabs>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent dividers>
          {/* Tab 1: Basic Info */}
          <TabPanel value={tabValue} index={0}>
            <Stack spacing={2}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: 2 }}>
                {/* <Controller
                  name="code"
                  control={control}
                  rules={{ required: 'Code is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Scheme Code"
                      fullWidth
                      error={!!errors.code}
                      helperText={errors.code?.message || 'Leave empty for auto-generation'}
                      disabled={!!scheme}
                      placeholder="e.g., SCHEME001"
                    />
                  )}
                /> */}

                <Controller
                  name="name"
                  control={control}
                  rules={{ required: 'Scheme name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Scheme Name"
                      fullWidth
                      error={!!errors.name}
                      helperText={errors.name?.message}
                      placeholder="e.g., Summer Promotion"
                    />
                  )}
                />

                <Controller
                  name="company"
                  control={control}
                  rules={{ required: 'Company is required' }}
                  render={({ field: { onChange } }) => (
                    <SearchableDropdown
                      label="Company"
                      apiEndpoint={API_ENDPOINTS.COMPANIES_DROPDOWN}
                      value={selectedCompany}
                      onChange={(selectedOption: DropdownOption | null) => {
                        setSelectedCompany(selectedOption);
                        onChange(selectedOption?.id || '');
                      }}
                      error={!!errors.company}
                      helperText={errors.company?.message}
                      placeholder="Select a company"
                    />
                  )}
                />

                <Controller
                  name="status"
                  control={control}
                  rules={{ required: 'Status is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="Status"
                      fullWidth
                      error={!!errors.status}
                      helperText={errors.status?.message}
                    >
                      {SCHEME_STATUSES.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: 2 }}>
                <Controller
                  name="type"
                  control={control}
                  rules={{ required: 'Scheme type is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="Scheme Type"
                      fullWidth
                      SelectProps={{ displayEmpty: true }}
                      error={!!errors.type}
                      helperText={errors.type?.message}
                    >
                      <MenuItem value="" disabled>
                        Select scheme type
                      </MenuItem>
                      {schemeTypeOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />

                <Controller
                  name="priority"
                  control={control}
                  rules={{ 
                    required: 'Priority is required',
                    min: { value: 0, message: 'Must be >= 0' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="number"
                      label="Priority"
                      fullWidth
                      error={!!errors.priority}
                      helperText={errors.priority?.message || 'Higher number = higher priority'}
                    />
                  )}
                />

                <Controller
                  name="effective_from"
                  control={control}
                  rules={{ required: 'Effective from date is required' }}
                  render={({ field }) => (
                    <DatePicker
                      format="DD-MM-YYYY"
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(date) =>
                        field.onChange(toDateString(date) || '')
                      }
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors.effective_from,
                          helperText: errors.effective_from?.message,
                          InputLabelProps: { shrink: true },
                        },
                      }}
                    />
                  )}
                />

                <Controller
                  name="effective_to"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      format="DD-MM-YYYY"
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(date) =>
                        field.onChange(toDateString(date) || null)
                      }
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          helperText: 'Leave blank for indefinite',
                          InputLabelProps: { shrink: true },
                        },
                      }}
                    />
                  )}
                />
              </Box>

              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Description"
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="Scheme description and details..."
                  />
                )}
              />
            </Stack>
          </TabPanel>

          {/* Tab 2: Conditions */}
          <TabPanel value={tabValue} index={1}>
            <Stack spacing={2}>
              <SchemeSummary
                schemeTypeLabel={schemeTypeLabel}
                schemeName={schemeNameDisplay}
                schemeCode={schemeCodeDisplay}
                statusLabel={statusLabel}
                effectiveRange={effectiveRange}
                priorityValue={priorityValue}
              />
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2">Scheme Conditions</Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={handleAddCondition}
                  size="small"
                  variant="outlined"
                >
                  Add Condition
                </Button>
              </Box>

              <Box sx={{ maxWidth: 360 }}>
                <TextField
                  select
                  label="Condition Match"
                  fullWidth
                  SelectProps={{ displayEmpty: true }}
                  value={conditionsOperator}
                  onChange={(event) => setConditionsOperator(event.target.value)}
                  error={conditions.length > 1 && !conditionsOperator}
                  helperText={
                    conditions.length > 1 && !conditionsOperator
                      ? 'Select how multiple conditions should be combined.'
                      : 'Applies between all conditions (AND/OR).'
                  }
                >
                  <MenuItem value="" disabled>
                    Select condition match
                  </MenuItem>
                  {CONDITION_OPERATORS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              {conditions.length > 0 ? (
                <Paper variant="outlined" sx={{ overflow: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Type</TableCell>
                        <TableCell>Details</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {conditions.map((condition, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Chip 
                              label={condition.condition_type_display || condition.condition_type || 'N/A'} 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell>
                            {condition.min_quantity && `Min Qty: ${condition.min_quantity}`}
                            {condition.min_value && `Min Value: ₹${condition.min_value}`}
                            {condition.item_name && `Item: ${condition.item_name}`}
                            {condition.category_name && `Category: ${condition.category_name}`}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteCondition(index)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
              ) : (
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
                  <Typography color="text.secondary">No conditions added yet</Typography>
                </Paper>
              )}
            </Stack>
          </TabPanel>

          {/* Tab 3: Benefits */}
          <TabPanel value={tabValue} index={2}>
            <Stack spacing={2}>
              <SchemeSummary
                schemeTypeLabel={schemeTypeLabel}
                schemeName={schemeNameDisplay}
                schemeCode={schemeCodeDisplay}
                statusLabel={statusLabel}
                effectiveRange={effectiveRange}
                priorityValue={priorityValue}
              />
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2">Scheme Benefits</Typography>
                <Button
                  startIcon={<AddIcon />}
                  size="small"
                  variant="outlined"
                  disabled
                >
                  Add Benefit
                </Button>
              </Box>

              {benefits.length > 0 ? (
                <Paper variant="outlined" sx={{ overflow: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Type</TableCell>
                        <TableCell>Value</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {benefits.map((benefit, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Chip 
                              label={benefit.benefit_type_display || benefit.benefit_type || 'N/A'} 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell>
                            {benefit.discount_value && `₹${benefit.discount_value}`}
                            {benefit.free_quantity && `Qty: ${benefit.free_quantity}`}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteBenefit(index)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
              ) : (
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
                  <Typography color="text.secondary">No benefits added yet</Typography>
                </Paper>
              )}
            </Stack>
          </TabPanel>

          {/* Tab 4: Applicability */}
          <TabPanel value={tabValue} index={3}>
            <Stack spacing={2}>
              <SchemeSummary
                schemeTypeLabel={schemeTypeLabel}
                schemeName={schemeNameDisplay}
                schemeCode={schemeCodeDisplay}
                statusLabel={statusLabel}
                effectiveRange={effectiveRange}
                priorityValue={priorityValue}
              />
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2">Applicable To</Typography>
                <Button
                  startIcon={<AddIcon />}
                  size="small"
                  variant="outlined"
                  disabled
                >
                  Add Applicability
                </Button>
              </Box>

              {applicability.length > 0 ? (
                <Paper variant="outlined" sx={{ overflow: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Customer Type</TableCell>
                        <TableCell>Scope</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {applicability.map((app, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Chip 
                              label={app.customer_type_display || app.customer_type || 'N/A'} 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell>
                            {app.state_name && `${app.state_name}`}
                            {app.city_name && ` / ${app.city_name}`}
                            {app.area_name && ` / ${app.area_name}`}
                            {app.superstockist_name && `SS: ${app.superstockist_name}`}
                            {app.distributor_name && `Dist: ${app.distributor_name}`}
                            {app.retailer_name && `Ret: ${app.retailer_name}`}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteApplicability(index)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
              ) : (
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
                  <Typography color="text.secondary">No applicability rules added yet</Typography>
                </Paper>
              )}
            </Stack>
          </TabPanel>

          {/* Tab 5: Items */}
          <TabPanel value={tabValue} index={4}>
            <Stack spacing={2}>
              <SchemeSummary
                schemeTypeLabel={schemeTypeLabel}
                schemeName={schemeNameDisplay}
                schemeCode={schemeCodeDisplay}
                statusLabel={statusLabel}
                effectiveRange={effectiveRange}
                priorityValue={priorityValue}
              />
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2">Applicable Items</Typography>
                <Button
                  startIcon={<AddIcon />}
                  size="small"
                  variant="outlined"
                  disabled
                >
                  Add Item
                </Button>
              </Box>

              {items.length > 0 ? (
                <Paper variant="outlined" sx={{ overflow: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Item / Category</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {item.item_name ? (
                              <Chip label={`Item: ${item.item_name}`} size="small" />
                            ) : item.category_name ? (
                              <Chip label={`Category: ${item.category_name}`} size="small" />
                            ) : (
                              'N/A'
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteItem(index)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
              ) : (
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
                  <Typography color="text.secondary">No items added yet</Typography>
                </Paper>
              )}
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
            {isSubmitting ? 'Saving...' : scheme ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default SchemeFormDialog;
