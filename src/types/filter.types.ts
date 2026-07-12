/**
 * Advanced Filtering Types
 * 
 * Types for filter builder, saved filters, and filter presets
 */

export interface FilterRule {
  id: string;
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_equals' | 'is_null' | 'is_not_null';
  value: any;
  value2?: any; // For between operator
}

export interface FilterConfig {
  rules: FilterRule[];
  logic: 'AND' | 'OR';
}

export interface SavedFilter {
  id: number;
  code?: string;
  name: string;
  description?: string;
  filter_config: FilterConfig;
  screen_name: string;
  is_public: boolean;
  is_default: boolean;
  usage_count: number;
  last_used?: string;
  created_on: string;
  created_by_type?: string;
  created_by_identifier?: string;
  modified_on?: string;
  is_deleted?: boolean;
}

export interface FilterPreset {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  filter_config: Record<string, any>;
  screen_name: string;
  sort_order: number;
  is_active: boolean;
  created_on?: string;
}

export interface FieldDefinition {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'datetime' | 'select' | 'boolean';
  options?: Array<{ value: string | number; label: string }>;
  operators?: FilterRule['operator'][];
}

export interface FilterBuilderProps {
  fields: FieldDefinition[];
  initialRules?: FilterRule[];
  onApply: (rules: FilterRule[]) => void;
  onClear: () => void;
  logic?: 'AND' | 'OR';
  onLogicChange?: (logic: 'AND' | 'OR') => void;
}

export interface SavedFiltersProps {
  screenName: string;
  currentRules: FilterRule[];
  onApplyFilter: (filter: SavedFilter) => void;
  onSaveSuccess?: (filter: SavedFilter) => void;
}

export interface FilterPresetsProps {
  screenName: string;
  onApplyPreset: (preset: FilterPreset) => void;
}
