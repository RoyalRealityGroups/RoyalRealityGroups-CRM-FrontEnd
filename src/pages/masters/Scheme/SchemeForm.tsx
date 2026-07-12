import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  TextField,
  IconButton,
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
  Breadcrumbs,
  Link,
  Grid,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Home as HomeIcon,
  Folder as FolderIcon,
  CardGiftcard as SchemeIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store/store';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { useToast } from '../../../contexts/ToastContext';
import dayjs from 'dayjs';
import { toDateString } from '../../../utils/format';
import { usePageTitle } from '../../../hooks';
import type {
  Scheme,
  SchemeFormData,
  SchemeCondition,
  SchemeBenefit,
  SchemeApplicability,
  SchemeItem,
} from '../../../types/masters.types';
import { API_ENDPOINTS } from '../../../utils/constants';
import apiClient from '../../../api/axios.config';
import ScreenHeader from '../../../components/common/ScreenHeader';
import SearchableDropdown from '../../../components/common/SearchableDropdown';
import SchemeConditionDialog from '../../../components/masters/SchemeConditionDialog';
import SchemeBenefitDialog from '../../../components/masters/SchemeBenefitDialog';
import SchemeApplicabilityDialog from '../../../components/masters/SchemeApplicabilityDialog';
import SchemeItemDialog from '../../../components/masters/SchemeItemDialog';
import type { DropdownOption } from '../../../types/common.types';
import {
  getPageContainerStyles,
  getHeaderSectionStyles,
  getContentSectionStyles,
  getDataGridStyles,
} from '../../../utils/spacing';

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

const SCHEME_DEFAULT_VALUES: SchemeFormData = {
  code: '',
  name: '',
  description: '',
  type: '',
  status: 'ACTIVE',
  priority: 0,
  // company: '',
  effective_from: new Date().toISOString().split('T')[0],
  effective_to: undefined,
  conditions: [],
  benefits: [],
  applicability: [],
  items: [],
};

const SCHEME_STATUSES: Array<DropdownOption> = [
  { id: 'ACTIVE', name: 'Active' },
  { id: 'INACTIVE', name: 'Inactive' },
  { id: 'EXPIRED', name: 'Expired' },
];

const CONDITION_OPERATORS: Array<DropdownOption> = [
  { id: 'AND', name: 'All conditions must match (AND)' },
  { id: 'OR', name: 'Any condition can match (OR)' },
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

const SchemeForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToast();
  const user = useSelector((state: RootState) => state.auth.user);
  const { setBreadcrumbs } = useBreadcrumbs();

  const extractFieldErrors = (data: any): string | null => {
    if (!data || typeof data !== 'object') return null;
    const messages: string[] = [];

    // Handle nested errors object: { errors: { benefits: [{ error: [...] }] } }
    const errorsObj = data.errors || data;
    for (const [key, value] of Object.entries(errorsObj)) {
      if (key === 'message' || key === 'detail' || key === 'error') continue;
      if (Array.isArray(value)) {
        for (const item of value) {
          if (typeof item === 'string') {
            messages.push(`${key}: ${item}`);
          } else if (item && typeof item === 'object' && item.error) {
            const errs = Array.isArray(item.error) ? item.error.join(', ') : item.error;
            messages.push(`${key}: ${errs}`);
          }
        }
        if (messages.length === 0 && value.every((v: any) => typeof v === 'string')) {
          messages.push(`${key}: ${value.join(', ')}`);
        }
      } else if (typeof value === 'string') {
        messages.push(`${key}: ${value}`);
      }
    }
    return messages.length > 0 ? messages.join('; ') : null;
  };

  const [tabValue, setTabValue] = useState(0);
  const [conditions, setConditions] = useState<Partial<SchemeCondition>[]>([]);
  const [conditionsOperator, setConditionsOperator] = useState<string>('');
  const [benefits, setBenefits] = useState<Partial<SchemeBenefit>[]>([]);
  const [benefitRequiredError, setBenefitRequiredError] = useState(false);
  const [applicability, setApplicability] = useState<Partial<SchemeApplicability>[]>([]);
  const [items, setItems] = useState<Partial<SchemeItem>[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<DropdownOption | null>(null);
  const [selectedItems, setSelectedItems] = useState<DropdownOption[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<DropdownOption[]>([]);
  
  // Dialog states
  const [conditionDialogOpen, setConditionDialogOpen] = useState(false);
  const [benefitDialogOpen, setBenefitDialogOpen] = useState(false);
  const [applicabilityDialogOpen, setApplicabilityDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingConditionIndex, setEditingConditionIndex] = useState<number | null>(null);
  const [editingBenefitIndex, setEditingBenefitIndex] = useState<number | null>(null);
  const [editingApplicabilityIndex, setEditingApplicabilityIndex] = useState<number | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  const isEditMode = !!id;

  // Set page title
  usePageTitle(isEditMode ? 'Edit Scheme' : 'Create Scheme');

  // Set breadcrumbs
  useEffect(() => {
    setBreadcrumbs([
      {
        label: 'Home',
        path: '/dashboard',
      },
      // {
      //   label: 'Masters',
      //   path: '/masters',
      // },
      {
        label: 'Schemes',
        path: '/scheme',
      },
      {
        label: isEditMode ? 'Edit' : 'Create',
        path: '',
      },
    ]);

    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs, isEditMode]);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<SchemeFormData>({
    defaultValues: SCHEME_DEFAULT_VALUES,
  });

  const onFormError = (formErrors: any) => {
    const fieldLabels: Record<string, string> = {
      name: 'Scheme Name',
      type: 'Scheme Type',
      status: 'Status',
      priority: 'Priority',
      effective_from: 'Effective From',
    };
    const missing = Object.keys(formErrors)
      .map(key => fieldLabels[key] || key)
      .join(', ');
    setTabValue(0);
    toastError(`Please fill all mandatory fields: ${missing}`);
  };

  // Fetch scheme details if editing
  const { data: schemeData, isLoading: isLoadingScheme } = useQuery({
    queryKey: ['scheme', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiClient.get(`${API_ENDPOINTS.SCHEMES}${id}/`);
      return response.data;
    },
    enabled: isEditMode,
  });

  const schemeType = watch('type');
  const summaryValues = watch([
    'code',
    'name',
    'type',
    'status',
    'effective_from',
    'effective_to',
    'priority',
  ]);

  const { data: schemeChoices } = useQuery({
    queryKey: ['scheme-choices', schemeType || 'all'],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.SCHEMES_CHOICES, {
        params: schemeType ? { scheme_type: schemeType } : undefined,
      });
      return response.data;
    },
    enabled: user != null,
  });

  const schemeTypeOptions: DropdownOption[] = schemeChoices?.scheme_types || [];
  const conditionTypeOptions: DropdownOption[] = schemeChoices?.condition_types || [];
  const benefitTypeOptions: DropdownOption[] = schemeChoices?.benefit_types || [];
  const canSelectConditionMatch = conditions.length >= 2;
  const conditionOperatorError = conditions.length > 1 && !conditionsOperator;

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
    schemeTypeOptions.find((option) => option.id === summaryType)?.name || summaryType
  );
  const statusLabel = formatDisplayValue(
    SCHEME_STATUSES.find((option) => option.id === summaryStatus)?.name || summaryStatus
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
    if (schemeData) {
      reset({
        code: schemeData.code,
        name: schemeData.name,
        description: schemeData.description || '',
        type: schemeData.type || schemeData.scheme_type,
        status: schemeData.status,
        priority: schemeData.priority,
        //company: schemeData.company || '',
        effective_from: schemeData.effective_from,
        effective_to: schemeData.effective_to || undefined,
        conditions: schemeData.conditions || [],
        benefits: schemeData.benefits || [],
        applicability: schemeData.applicability || [],
        items: schemeData.items || [],
      });
      // setSelectedCompany(
      //   schemeData.company
      //     ? { id: schemeData.company, name: schemeData.company_name || '' }
      //     : null
      // );
      const loadedConditions = schemeData.conditions || [];
      setConditions(loadedConditions);
      setConditionsOperator(
        loadedConditions.length >= 2
          ? (loadedConditions[0]?.logical_operator || '')
          : ''
      );
      setBenefits(schemeData.benefits || []);
      setApplicability(schemeData.applicability || []);
      setItems(schemeData.items || []);
    }
  }, [schemeData, reset]);

  useEffect(() => {
    if (conditions.length < 2 && conditionsOperator) {
      setConditionsOperator('');
    }
  }, [conditions.length, conditionsOperator]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: SchemeFormData) => {
      const response = await apiClient.post(API_ENDPOINTS.SCHEMES, data);
      return response.data;
    },
    onSuccess: () => {
      toastSuccess('Scheme created successfully');
      queryClient.invalidateQueries({ queryKey: ['schemes'] });
      navigate('/scheme');
    },
    onError: (error: any) => {
      const data = error?.response?.data;
      const msg = data?.message || data?.detail || extractFieldErrors(data) || 'Unable to create scheme';
      toastError(msg);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: SchemeFormData) => {
      const response = await apiClient.put(`${API_ENDPOINTS.SCHEMES}${id}/`, data);
      return response.data;
    },
    onSuccess: () => {
      toastSuccess('Scheme updated successfully');
      queryClient.invalidateQueries({ queryKey: ['schemes'] });
      queryClient.invalidateQueries({ queryKey: ['scheme', id] });
      navigate('/scheme');
    },
    onError: (error: any) => {
      const data = error?.response?.data;
      const msg = data?.message || data?.detail || extractFieldErrors(data) || 'Unable to update scheme';
      toastError(msg);
    },
  });

  const handleFormSubmit = async (data: SchemeFormData) => {
    if (conditions.length > 1 && !conditionsOperator) {
      setTabValue(1);
      toastError('Select how multiple conditions should be combined (AND / OR).');
      return;
    }
    if (benefits.length === 0) {
      setTabValue(2);
      setBenefitRequiredError(true);
      toastError('Please add at least one benefit.');
      return;
    }

    const normalizedConditions = conditions.map((condition) => {
      if (conditions.length > 1 && conditionsOperator) {
        return { ...condition, logical_operator: conditionsOperator };
      }
      const { logical_operator, ...conditionWithoutOperator } = condition;
      return conditionWithoutOperator;
    });

    const { type, code, ...rest } = data;
    const submitData = {
      ...rest,
      ...(code ? { code } : {}),
      scheme_type: type,
      conditions: normalizedConditions,
      benefits,
      applicability,
      items,
    };

    if (isEditMode) {
      await updateMutation.mutateAsync(submitData as any);
    } else {
      await createMutation.mutateAsync(submitData as any);
    }
  };

  const handleFormSubmitAsDraft = async (data: SchemeFormData) => {
    if (conditions.length > 1 && !conditionsOperator) {
      setTabValue(1);
      toastError('Select how multiple conditions should be combined (AND / OR).');
      return;
    }
    if (benefits.length === 0) {
      setTabValue(2);
      setBenefitRequiredError(true);
      toastError('Please add at least one benefit.');
      return;
    }

    const normalizedConditions = conditions.map((condition) => {
      if (conditions.length > 1 && conditionsOperator) {
        return { ...condition, logical_operator: conditionsOperator };
      }
      const { logical_operator, ...conditionWithoutOperator } = condition;
      return conditionWithoutOperator;
    });

    const { type, code, ...rest } = data;
    const submitData = {
      ...rest,
      ...(code ? { code } : {}),
      scheme_type: type,
      status: 'DRAFT',
      conditions: normalizedConditions,
      benefits,
      applicability,
      items,
    };

    if (isEditMode) {
      await updateMutation.mutateAsync(submitData as any);
    } else {
      await createMutation.mutateAsync(submitData as any);
    }
  };

  const handleSaveAsDraft = () => {
    handleSubmit(handleFormSubmitAsDraft, onFormError)();
  };

  const handleBack = () => {
    navigate('/scheme');
  };

  const handleAddCondition = () => {
    setEditingConditionIndex(null);
    setConditionDialogOpen(true);
  };
  
  const handleEditCondition = (index: number) => {
    setEditingConditionIndex(index);
    setConditionDialogOpen(true);
  };
  
  const handleSaveCondition = (condition: Partial<SchemeCondition>) => {
    if (editingConditionIndex !== null) {
      const updated = [...conditions];
      updated[editingConditionIndex] = condition;
      setConditions(updated);
    } else {
      setConditions([...conditions, condition]);
    }
  };

  const handleAddBenefit = () => {
    setEditingBenefitIndex(null);
    setBenefitRequiredError(false);
    setBenefitDialogOpen(true);
  };
  
  const handleEditBenefit = (index: number) => {
    setEditingBenefitIndex(index);
    setBenefitDialogOpen(true);
  };
  
  const handleSaveBenefit = (benefit: Partial<SchemeBenefit>) => {
    if (editingBenefitIndex !== null) {
      const updated = [...benefits];
      updated[editingBenefitIndex] = benefit;
      setBenefits(updated);
    } else {
      setBenefits([...benefits, benefit]);
    }
    setBenefitRequiredError(false);
  };

  const handleAddApplicability = () => {
    setEditingApplicabilityIndex(null);
    setApplicabilityDialogOpen(true);
  };
  
  const handleEditApplicability = (index: number) => {
    setEditingApplicabilityIndex(index);
    setApplicabilityDialogOpen(true);
  };
  
  const handleSaveApplicability = (applicabilityData: Partial<SchemeApplicability>) => {
    if (editingApplicabilityIndex !== null) {
      const updated = [...applicability];
      updated[editingApplicabilityIndex] = applicabilityData;
      setApplicability(updated);
    } else {
      setApplicability([...applicability, applicabilityData]);
    }
  };

  const handleAddItem = () => {
    setEditingItemIndex(null);
    setItemDialogOpen(true);
  };
  
  const handleEditItem = (index: number) => {
    setEditingItemIndex(index);
    setItemDialogOpen(true);
  };
  
  const handleSaveItem = (item: Partial<SchemeItem>) => {
    if (editingItemIndex !== null) {
      const updated = [...items];
      updated[editingItemIndex] = item;
      setItems(updated);
    } else {
      setItems([...items, item]);
    }
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

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (isEditMode && isLoadingScheme) {
    return (
      <Box sx={getPageContainerStyles()}>
        <ScreenHeader
          title="Edit Scheme"
          showBackButton
          onBack={handleBack}
        />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <Typography>Loading scheme details...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Fixed Header */}
      <Box sx={getHeaderSectionStyles()}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}>
          <Box display="flex" alignItems="center" gap={1}>
            <IconButton onClick={handleBack} size="small">
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {isEditMode ? 'Edit Scheme' : 'Add Scheme'}
            </Typography>
          </Box>
          
          {/* Action Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            {(!isEditMode || schemeData?.status === 'DRAFT') && (
              <Button
                variant="outlined"
                color="primary"
                size="small"
                onClick={handleSaveAsDraft}
                disabled={isSubmitting}
              >
                Save as Draft
              </Button>
            )}
            <Button
              type="submit"
              form="scheme-form"
              variant="contained"
              color="primary"
              size="small"
              startIcon={<SaveIcon fontSize="small" />}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update Scheme' : 'Create Scheme'}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Scrollable Content Area */}
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Paper
          sx={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: 0,
            m: 2,
          }}
        >
          {/* Fixed Tabs */}
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider', px: 3, flexShrink: 0 }}
          >
            <Tab label="Basic Info" />
            <Tab label="Conditions" />
            <Tab label="Benefits" />
            <Tab label="Applicability" />
            <Tab label="Products" />
          </Tabs>

          {/* Scrollable Form Content */}
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <form id="scheme-form" onSubmit={handleSubmit(handleFormSubmit, onFormError)}>
              <Box sx={{ p: 3 }}>
              {/* Tab 1: Basic Info */}
              <TabPanel value={tabValue} index={0}>
                <Stack spacing={3}>
                  <Grid container spacing={3}>
                    {/* Scheme Code */}
                    {/* <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Typography 
                        variant="subtitle2" 
                        sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                      >
                        Scheme Code
                      </Typography>
                      <Controller
                        name="code"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            placeholder="e.g., SCHEME001"
                            fullWidth
                            size="small"
                            error={!!errors.code}
                            helperText={errors.code?.message || 'Leave empty for auto-generation'}
                            disabled={isEditMode}
                            value={field.value?.toUpperCase() || ''}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          />
                        )}
                      />
                    </Grid> */}

                    {/* Scheme Name */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Typography 
                        variant="subtitle2" 
                        sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                      >
                        Scheme Name <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                      </Typography>
                      <Controller
                        name="name"
                        control={control}
                        rules={{ required: 'Scheme name is required' }}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            placeholder="e.g., Summer Promotion"
                            fullWidth
                            size="small"
                            error={!!errors.name}
                            helperText={errors.name?.message}
                          />
                        )}
                      />
                    </Grid>

                    {/* Company */}
                    {/* <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Typography 
                        variant="subtitle2" 
                        sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                      >
                        Company <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                      </Typography>
                      <Controller
                        name="company"
                        control={control}
                        rules={{ required: 'Company is required' }}
                        render={({ field: { onChange } }) => (
                          <SearchableDropdown
                            label=""
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
                    </Grid> */}

                    {/* Status */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Typography 
                        variant="subtitle2" 
                        sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                      >
                        Status <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                      </Typography>
                      <Controller
                        name="status"
                        control={control}
                        rules={{ required: 'Status is required' }}
                        render={({ field }) => (
                          <SearchableDropdown
                            label=""
                            apiEndpoint=""
                            staticOptions={SCHEME_STATUSES}
                            value={SCHEME_STATUSES.find(s => s.id === field.value) || null}
                            onChange={(option: DropdownOption | null) => field.onChange(option?.id)}
                            error={!!errors.status}
                            helperText={errors.status?.message}
                            placeholder="Select status"
                          />
                        )}
                      />
                    </Grid>

                    {/* Scheme Type */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Typography 
                        variant="subtitle2" 
                        sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                      >
                        Scheme Type <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                      </Typography>
                      <Controller
                        name="type"
                        control={control}
                        rules={{ required: 'Scheme type is required' }}
                        render={({ field }) => (
                          <SearchableDropdown
                            label=""
                            apiEndpoint=""
                            staticOptions={schemeTypeOptions}
                            value={schemeTypeOptions.find(t => t.id === field.value) || null}
                            onChange={(option: DropdownOption | null) => field.onChange(option?.id)}
                            error={!!errors.type}
                            helperText={errors.type?.message || 'Select discount strategy'}
                            placeholder="Select scheme type"
                          />
                        )}
                      />
                    </Grid>

                    {/* Priority */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Typography 
                        variant="subtitle2" 
                        sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                      >
                        Priority <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                      </Typography>
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
                            placeholder="0"
                            fullWidth
                            size="small"
                            error={!!errors.priority}
                            helperText={errors.priority?.message || 'Higher number = higher priority'}
                          />
                        )}
                      />
                    </Grid>

                    {/* Effective From */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                            onChange={(date) =>
                              field.onChange(toDateString(date) || '')
                            }
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                size: 'small',
                                error: !!errors.effective_from,
                                helperText: errors.effective_from?.message,
                                InputLabelProps: { shrink: true },
                              },
                            }}
                          />
                        )}
                      />
                    </Grid>

                    {/* Effective To */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                            onChange={(date) =>
                              field.onChange(toDateString(date) || null)
                            }
                            minDate={watch('effective_from') ? dayjs(watch('effective_from')) : undefined}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                size: 'small',
                                helperText: 'Leave blank for indefinite',
                                InputLabelProps: { shrink: true },
                              },
                            }}
                          />
                        )}
                      />
                    </Grid>
                    {/* Description */}
                    <Grid size={{ xs: 12, md: 12 }}>
                      <Typography 
                        variant="subtitle2" 
                        sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}
                      >
                        Description
                      </Typography>
                      <Controller
                        name="description"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            placeholder="Scheme description and details..."
                            fullWidth
                            size="small"
                            multiline
                            rows={2}
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </Stack>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                  <Button variant="outlined" size="small" endIcon={<NextIcon />} onClick={() => setTabValue(1)}>
                    Next
                  </Button>
                </Box>
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
                  <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      Scheme Conditions
                    </Typography>
                    <Button
                      startIcon={<AddIcon />}
                      onClick={handleAddCondition}
                      size="small"
                      variant="outlined"
                    >
                      Add Condition
                    </Button>
                  </Box>

                  <Box sx={{ maxWidth: 420 }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                      Condition Match
                      {conditions.length > 1 && (
                        <Box component="span" sx={{ color: '#f44336', fontWeight: 600, ml: 0.5 }}>*</Box>
                      )}
                    </Typography>
                    <SearchableDropdown
                      label=""
                      apiEndpoint=""
                      staticOptions={CONDITION_OPERATORS}
                      value={CONDITION_OPERATORS.find(o => o.id === conditionsOperator) || null}
                      onChange={(option: DropdownOption | null) => setConditionsOperator(option?.id ? String(option.id) : '')}
                      disabled={!canSelectConditionMatch}
                      error={conditionOperatorError}
                      helperText={
                        conditionOperatorError
                          ? 'Select how multiple conditions should be combined.'
                          : !canSelectConditionMatch
                            ? 'Add at least 2 conditions to enable condition match selection.'
                            : 'Applies between all conditions (AND/OR).'
                      }
                      placeholder="Select condition match"
                    />
                  </Box>

                  {conditions.length > 0 ? (
                    <Paper variant="outlined" sx={{ overflow: 'auto' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Type</TableCell>
                            <TableCell>Value From</TableCell>
                            <TableCell>Value To</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell>Item</TableCell>
                            <TableCell align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {conditions.map((condition, index) => (
                            <TableRow key={index} hover>
                              <TableCell>
                                <Chip 
                                  label={condition.condition_type_display || condition.condition_type || 'N/A'} 
                                  size="small" 
                                />
                              </TableCell>
                              <TableCell>
                                {condition.value_from ?? '—'}
                              </TableCell>
                              <TableCell>
                                {condition.value_to ?? '—'}
                              </TableCell>
                              <TableCell>
                                {condition.category_name || '—'}
                              </TableCell>
                              <TableCell>
                                {condition.item_name || '—'}
                              </TableCell>
                              <TableCell align="right">
                                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleEditCondition(index)}
                                    color="primary"
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDeleteCondition(index)}
                                    color="error"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
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
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                    <Button variant="outlined" size="small" startIcon={<PrevIcon />} onClick={() => setTabValue(0)}>
                      Previous
                    </Button>
                    <Button variant="outlined" size="small" endIcon={<NextIcon />} onClick={() => setTabValue(2)}>
                      Next
                    </Button>
                  </Box>
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
                  <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      Scheme Benefits
                    </Typography>
                    <Button
                      startIcon={<AddIcon />}
                      onClick={handleAddBenefit}
                      size="small"
                      variant="outlined"
                    >
                      Add Benefit
                    </Button>
                  </Box>
                  {benefitRequiredError && (
                    <Typography color="error" variant="body2">
                      Please add at least one benefit.
                    </Typography>
                  )}

                  {benefits.length > 0 ? (
                    <Paper variant="outlined" sx={{ overflow: 'auto' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Type</TableCell>
                            <TableCell>Discount Value</TableCell>
                            <TableCell>Max Discount</TableCell>
                            <TableCell>Free Item</TableCell>
                            <TableCell>Free Qty</TableCell>
                            <TableCell>Apply to All</TableCell>
                            <TableCell>Apply Category</TableCell>
                            <TableCell>Apply Item</TableCell>
                            <TableCell align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {benefits.map((benefit, index) => (
                            <TableRow key={index} hover>
                              <TableCell>
                                <Chip 
                                  label={benefit.benefit_type_display || benefit.benefit_type || 'N/A'} 
                                  size="small" 
                                />
                              </TableCell>
                              <TableCell>
                                {benefit.discount_value ?? '—'}
                              </TableCell>
                              <TableCell>
                                {benefit.max_discount_amount ?? '—'}
                              </TableCell>
                              <TableCell>
                                {benefit.free_item_name || '—'}
                              </TableCell>
                              <TableCell>
                                {benefit.free_quantity ?? '—'}
                              </TableCell>
                              <TableCell>
                                {benefit.apply_to_all ? 'Yes' : 'No'}
                              </TableCell>
                              <TableCell>
                                {benefit.apply_to_category_name || '—'}
                              </TableCell>
                              <TableCell>
                                {benefit.apply_to_item_name || '—'}
                              </TableCell>
                              <TableCell align="right">
                                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleEditBenefit(index)}
                                    color="primary"
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDeleteBenefit(index)}
                                    color="error"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
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
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                    <Button variant="outlined" size="small" startIcon={<PrevIcon />} onClick={() => setTabValue(1)}>
                      Previous
                    </Button>
                    <Button variant="outlined" size="small" endIcon={<NextIcon />} onClick={() => setTabValue(3)}>
                      Next
                    </Button>
                  </Box>
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
                  <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      Applicable To
                    </Typography>
                    <Button
                      startIcon={<AddIcon />}
                      onClick={handleAddApplicability}
                      size="small"
                      variant="outlined"
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
                            <TableCell>Apply to All</TableCell>
                            <TableCell>State</TableCell>
                            <TableCell>City</TableCell>
                            <TableCell>Area</TableCell>
                            <TableCell>Superstockist</TableCell>
                            <TableCell>Distributor</TableCell>
                            <TableCell>Retailer</TableCell>
                            <TableCell align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {applicability.map((app, index) => (
                            <TableRow key={index} hover>
                              <TableCell>
                                <Chip 
                                  label={app.customer_type_display || app.customer_type || 'N/A'} 
                                  size="small" 
                                />
                              </TableCell>
                              <TableCell>
                                {app.apply_to_all ? 'Yes' : 'No'}
                              </TableCell>
                              <TableCell>
                                {app.state_name || '—'}
                              </TableCell>
                              <TableCell>
                                {app.city_name || '—'}
                              </TableCell>
                              <TableCell>
                                {app.area_name || '—'}
                              </TableCell>
                              <TableCell>
                                {app.superstockist_name || '—'}
                              </TableCell>
                              <TableCell>
                                {app.distributor_name || '—'}
                              </TableCell>
                              <TableCell>
                                {app.retailer_name || '—'}
                              </TableCell>
                              <TableCell align="right">
                                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleEditApplicability(index)}
                                    color="primary"
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDeleteApplicability(index)}
                                    color="error"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
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
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                    <Button variant="outlined" size="small" startIcon={<PrevIcon />} onClick={() => setTabValue(2)}>
                      Previous
                    </Button>
                    <Button variant="outlined" size="small" endIcon={<NextIcon />} onClick={() => setTabValue(4)}>
                      Next
                    </Button>
                  </Box>
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
                  <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      Applicable Items
                    </Typography>
                    <Button
                      startIcon={<AddIcon />}
                      onClick={handleAddItem}
                      size="small"
                      variant="outlined"
                    >
                      Add Item
                    </Button>
                  </Box>

                  {items.length > 0 ? (
                    <Paper variant="outlined" sx={{ overflow: 'auto' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Include All</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell>Item</TableCell>
                            <TableCell align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {items.map((item, index) => (
                            <TableRow key={index} hover>
                              <TableCell>
                                {item.include_all_items ? 'Yes' : 'No'}
                              </TableCell>
                              <TableCell>
                                {item.include_all_items ? '—' : (item.category_name || '—')}
                              </TableCell>
                              <TableCell>
                                {item.include_all_items ? '—' : (item.item_name || '—')}
                              </TableCell>
                              <TableCell align="right">
                                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleEditItem(index)}
                                    color="primary"
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDeleteItem(index)}
                                    color="error"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
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
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 3 }}>
                    <Button variant="outlined" size="small" startIcon={<PrevIcon />} onClick={() => setTabValue(3)}>
                      Previous
                    </Button>
                  </Box>
                </Stack>
              </TabPanel>
              </Box>
            </form>
          </Box>
        </Paper>
      </Box>
      
      {/* Dialogs */}
      <SchemeConditionDialog
        open={conditionDialogOpen}
        onClose={() => setConditionDialogOpen(false)}
        onSave={handleSaveCondition}
        condition={editingConditionIndex !== null ? conditions[editingConditionIndex] : undefined}
        conditionTypeOptions={conditionTypeOptions}
      />
      
      <SchemeBenefitDialog
        open={benefitDialogOpen}
        onClose={() => setBenefitDialogOpen(false)}
        onSave={handleSaveBenefit}
        benefit={editingBenefitIndex !== null ? benefits[editingBenefitIndex] : undefined}
        benefitTypeOptions={benefitTypeOptions}
        schemeType={schemeType}
      />
      
      <SchemeApplicabilityDialog
        open={applicabilityDialogOpen}
        onClose={() => setApplicabilityDialogOpen(false)}
        onSave={handleSaveApplicability}
        applicability={editingApplicabilityIndex !== null ? applicability[editingApplicabilityIndex] : undefined}
      />
      
      <SchemeItemDialog
        open={itemDialogOpen}
        onClose={() => setItemDialogOpen(false)}
        onSave={handleSaveItem}
        schemeItem={editingItemIndex !== null ? items[editingItemIndex] : undefined}
      />
    </Box>
  );
};

export default SchemeForm;
