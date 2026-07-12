import React from 'react';
import { Box, Button } from '@mui/material';
import SearchableDropdown from './SearchableDropdown';
import type { DropdownOption } from '../../types/common.types';

type DropdownValue = DropdownOption | DropdownOption[] | null;

interface SearchableDropdownWithCreateProps {
  label: string;
  apiEndpoint: string;
  value: DropdownValue;
  onChange: (value: DropdownValue) => void;
  onCreateClick: () => void;
  labelKey?: string;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  additionalFilters?: Record<string, any>;
  multiple?: boolean;
  size?: 'small' | 'medium';
  formatOptionLabel?: (option: any) => string;
  staticOptions?: DropdownOption[];
  showCreateButton?: boolean;
  refreshKey?: number;
}

const SearchableDropdownWithCreate: React.FC<SearchableDropdownWithCreateProps> = ({
  onCreateClick,
  showCreateButton = true,
  ...dropdownProps
}) => {
  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
      <Box sx={{ flex: 1 }}>
        <SearchableDropdown {...dropdownProps} />
      </Box>
      {showCreateButton && (
        <Button
          onClick={onCreateClick}
          disabled={dropdownProps.disabled}
          variant="outlined"
          sx={{
            minWidth: 'auto',
            height: 42,
            px: 2,
            borderColor: 'rgba(0, 0, 0, 0.23)',
            color: 'text.primary',
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: 'rgba(0, 103, 102, 0.04)',
            },
          }}
        >+
        </Button>
      )}
    </Box>
  );
};

export default SearchableDropdownWithCreate;
