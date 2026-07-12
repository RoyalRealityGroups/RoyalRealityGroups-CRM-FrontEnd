/**
 * FilterBuilder Component
 * 
 * A powerful filter builder UI that allows users to construct complex filters
 * with multiple rules and operators.
 */

import React, { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Paper,
  Select,
  MenuItem,
  TextField,
  FormControl,
  InputLabel,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import type { FilterRule, FilterBuilderProps, FieldDefinition } from '../../types/filter.types';

const operatorLabels: Record<FilterRule['operator'], string> = {
  equals: 'Equals',
  not_equals: 'Not Equals',
  contains: 'Contains',
  greater_than: 'Greater Than',
  less_than: 'Less Than',
  between: 'Between',
  in: 'In',
  is_null: 'Is Null',
  is_not_null: 'Is Not Null',
};

export const FilterBuilder: React.FC<FilterBuilderProps> = ({
  fields,
  initialRules = [],
  onApply,
  onClear,
  logic = 'AND',
  onLogicChange,
}) => {
  const [rules, setRules] = useState<FilterRule[]>(
    initialRules.length > 0 ? initialRules : []
  );
  const [currentLogic, setCurrentLogic] = useState<'AND' | 'OR'>(logic);

  const getFieldDefinition = (fieldKey: string): FieldDefinition | undefined => {
    return fields.find((f) => f.key === fieldKey);
  };

  const getAvailableOperators = (fieldKey: string): FilterRule['operator'][] => {
    const field = getFieldDefinition(fieldKey);
    if (field?.operators) {
      return field.operators;
    }

    // Default operators based on field type
    switch (field?.type) {
      case 'number':
      case 'date':
      case 'datetime':
        return ['equals', 'not_equals', 'greater_than', 'less_than', 'between', 'is_null', 'is_not_null'];
      case 'select':
        return ['equals', 'not_equals', 'in', 'is_null', 'is_not_null'];
      case 'boolean':
        return ['equals'];
      case 'text':
      default:
        return ['equals', 'not_equals', 'contains', 'is_null', 'is_not_null'];
    }
  };

  const addRule = () => {
    const firstField = fields[0];
    if (!firstField) return;

    const availableOps = getAvailableOperators(firstField.key);
    const newRule: FilterRule = {
      id: `rule-${Date.now()}`,
      field: firstField.key,
      operator: availableOps[0] || 'equals',
      value: '',
    };
    setRules([...rules, newRule]);
  };

  const updateRule = (id: string, updates: Partial<FilterRule>) => {
    setRules(
      rules.map((rule) => {
        if (rule.id !== id) return rule;

        const updatedRule = { ...rule, ...updates };

        // Reset value if field changed
        if (updates.field && updates.field !== rule.field) {
          const field = getFieldDefinition(updates.field);
          const availableOps = getAvailableOperators(updates.field);
          updatedRule.operator = availableOps[0] || 'equals';
          updatedRule.value = field?.type === 'boolean' ? false : '';
          updatedRule.value2 = undefined;
        }

        // Reset value2 if operator changed from 'between'
        if (updates.operator && updates.operator !== 'between') {
          updatedRule.value2 = undefined;
        }

        return updatedRule;
      })
    );
  };

  const removeRule = (id: string) => {
    setRules(rules.filter((rule) => rule.id !== id));
  };

  const handleApply = () => {
    onApply(rules);
  };

  const handleClear = () => {
    setRules([]);
    onClear();
  };

  const handleLogicChange = (
    _event: React.MouseEvent<HTMLElement>,
    newLogic: 'AND' | 'OR' | null
  ) => {
    if (newLogic !== null) {
      setCurrentLogic(newLogic);
      if (onLogicChange) {
        onLogicChange(newLogic);
      }
    }
  };

  const needsValueInput = (operator: FilterRule['operator']): boolean => {
    return operator !== 'is_null' && operator !== 'is_not_null';
  };

  const renderValueInput = (rule: FilterRule) => {
    const field = getFieldDefinition(rule.field);
    if (!field || !needsValueInput(rule.operator)) return null;

    const commonProps = {
      value: rule.value,
      onChange: (e: any) => updateRule(rule.id, { value: e.target.value }),
      size: 'small' as const,
      fullWidth: true,
    };

    switch (field.type) {
      case 'select':
        return (
          <FormControl fullWidth size="small">
            <Select {...commonProps} displayEmpty>
              <MenuItem value="">
                <em>Select value</em>
              </MenuItem>
              {field.options?.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'boolean':
        return (
          <FormControl fullWidth size="small">
            <Select {...commonProps}>
              <MenuItem value="true">True</MenuItem>
              <MenuItem value="false">False</MenuItem>
            </Select>
          </FormControl>
        );

      case 'number':
        return <TextField {...commonProps} type="number" placeholder="Enter value" />;

      case 'date':
        return <TextField {...commonProps} type="date" InputLabelProps={{ shrink: true }} />;

      case 'datetime':
        return <TextField {...commonProps} type="datetime-local" InputLabelProps={{ shrink: true }} />;

      case 'text':
      default:
        return <TextField {...commonProps} placeholder="Enter value" />;
    }
  };

  if (fields.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">
          No filterable fields available
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <FilterIcon color="primary" />
        <Typography variant="h6">Filter Builder</Typography>
        {rules.length > 1 && (
          <>
            <Divider orientation="vertical" flexItem />
            <Typography variant="body2" color="text.secondary">
              Match
            </Typography>
            <ToggleButtonGroup
              value={currentLogic}
              exclusive
              onChange={handleLogicChange}
              size="small"
            >
              <ToggleButton value="AND">ALL</ToggleButton>
              <ToggleButton value="OR">ANY</ToggleButton>
            </ToggleButtonGroup>
            <Typography variant="body2" color="text.secondary">
              conditions
            </Typography>
          </>
        )}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {rules.map((rule, index) => {
          const field = getFieldDefinition(rule.field);
          const availableOperators = getAvailableOperators(rule.field);

          return (
            <Box key={rule.id}>
              {index > 0 && (
                <Chip
                  label={currentLogic}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ mb: 1 }}
                />
              )}
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                {/* Field Selection */}
                <FormControl sx={{ minWidth: 200 }} size="small">
                  <InputLabel>Field</InputLabel>
                  <Select
                    value={rule.field}
                    onChange={(e) => updateRule(rule.id, { field: e.target.value })}
                    label="Field"
                  >
                    {fields.map((f) => (
                      <MenuItem key={f.key} value={f.key}>
                        {f.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Operator Selection */}
                <FormControl sx={{ minWidth: 150 }} size="small">
                  <InputLabel>Operator</InputLabel>
                  <Select
                    value={rule.operator}
                    onChange={(e) =>
                      updateRule(rule.id, { operator: e.target.value as FilterRule['operator'] })
                    }
                    label="Operator"
                  >
                    {availableOperators.map((op) => (
                      <MenuItem key={op} value={op}>
                        {operatorLabels[op]}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Value Input */}
                {needsValueInput(rule.operator) && (
                  <Box sx={{ flex: 1 }}>{renderValueInput(rule)}</Box>
                )}

                {/* Second Value for Between */}
                {rule.operator === 'between' && (
                  <TextField
                    label="To"
                    value={rule.value2 || ''}
                    onChange={(e) => updateRule(rule.id, { value2: e.target.value })}
                    size="small"
                    type={field?.type === 'number' ? 'number' : field?.type === 'date' ? 'date' : 'text'}
                    sx={{ flex: 1 }}
                    InputLabelProps={
                      field?.type === 'date' || field?.type === 'datetime'
                        ? { shrink: true }
                        : undefined
                    }
                  />
                )}

                {/* Remove Button */}
                <IconButton color="error" onClick={() => removeRule(rule.id)} size="small">
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>
          );
        })}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={addRule}>
            Add Rule
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button variant="outlined" color="secondary" onClick={handleClear}>
            Clear All
          </Button>
          <Button variant="contained" onClick={handleApply} disabled={rules.length === 0}>
            Apply Filters ({rules.length})
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default FilterBuilder;
