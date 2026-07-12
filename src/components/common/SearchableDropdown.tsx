import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Autocomplete,
  TextField,
  CircularProgress,
  Chip,
} from '@mui/material';
import type { DropdownOption } from '../../types/common.types';
import apiClient from '../../api/axios.config';

type DropdownValue = DropdownOption | DropdownOption[] | null;

interface SearchableDropdownProps {
  label: string;
  apiEndpoint: string;
  value: DropdownValue;
  onChange: (value: DropdownValue) => void;
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
  staticOptions?: DropdownOption[]; // For static dropdown options
  refreshKey?: number; // Increment to force refetch
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  label,
  apiEndpoint,
  value,
  onChange,
  labelKey = 'name',
  error = false,
  helperText,
  required = false,
  disabled = false,
  placeholder,
  additionalFilters,
  multiple = false,
  size = 'small',
  formatOptionLabel,
  staticOptions,
  refreshKey,
}) => {
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [pendingOpen, setPendingOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const skipOpenFetchRef = useRef(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 10;
  const isMulti = multiple;
  const hasMultiValue = isMulti && Array.isArray(value) && value.length > 0;
  const effectivePlaceholder = hasMultiValue ? '' : placeholder;
  const inputMinHeight = isMulti ? 36 : 42;

  const resolvedOptions = useMemo(() => {
    if (!staticOptions) {
      return options;
    }
    if (!options.length) {
      return staticOptions;
    }
    const merged = [...staticOptions];
    options.forEach((opt) => {
      if (!merged.find((existing) => existing.id === opt.id)) {
        merged.unshift(opt);
      }
    });
    return merged;
  }, [staticOptions, options]);

  const getDisplayLabel = (option: any) => {
    if (!option) {
      return '';
    }
    if (formatOptionLabel) {
      return formatOptionLabel(option);
    }
    if (option.fullname && String(option.fullname).trim() !== '') {
      return option.fullname;
    }
    if (option.first_name || option.last_name) {
      const full = `${option.first_name || ''} ${option.last_name || ''}`.trim();
      if (full) {
        return full;
      }
    }
    if (option.username && option.username !== '') {
      return option.username;
    }
    if (option.code && option.name) {
      return `${option.code} - ${option.name}`;
    }
    return option?.[labelKey] || option?.name || '';
  };

  // Clear stale options when endpoint or filters change
  useEffect(() => {
    setOptions([]);
    setPage(1);
    setHasMore(false);
  }, [apiEndpoint, JSON.stringify(additionalFilters), refreshKey]);

  // Ensure selected value is in options
  useEffect(() => {
    if (value && !Array.isArray(value)) {
      const valueInOptions = resolvedOptions.some((opt: any) => opt.id === (value as any).id);
      if (!valueInOptions && (value as any).id) {
        setOptions((prev) => [value as DropdownOption, ...prev]);
      }
    }
  }, [value, resolvedOptions]);

  // Fetch options when dropdown opens or search query changes
  useEffect(() => {
    if (staticOptions) {
      return;
    }

    if (!open && !pendingOpen) {
      return;
    }

    if (skipOpenFetchRef.current && open && !pendingOpen) {
      skipOpenFetchRef.current = false;
      return;
    }

    let cancelled = false;

    const fetchOptions = async () => {
      setLoading(true);
      try {
        const params: Record<string, any> = { search: searchQuery, page_size: PAGE_SIZE, page: 1 };
        if (additionalFilters) {
          Object.assign(params, additionalFilters);
        }
        const response = await apiClient.get(apiEndpoint, { params });
        const data = response.data.results || response.data;
        const sorted = Array.isArray(data)
          ? [...data].sort((a, b) => ((a?.[labelKey] || '') as string).localeCompare((b?.[labelKey] || '') as string, undefined, { sensitivity: 'base' }))
          : [];
        if (cancelled) return;
        setOptions(sorted);
        setPage(1);
        const count = response.data.count;
        setHasMore(count != null ? sorted.length < count : (response.data.next != null));
      } catch (err) {
        if (cancelled) return;
        setOptions([]);
        setHasMore(false);
      } finally {
        if (cancelled) return;
        setLoading(false);
        if (pendingOpen) {
          skipOpenFetchRef.current = true;
          setPendingOpen(false);
          setOpen(true);
        }
      }
    };

    if (pendingOpen) {
      fetchOptions();
      return () => {
        cancelled = true;
      };
    }

    const debounce = setTimeout(fetchOptions, 300);

    return () => {
      cancelled = true;
      clearTimeout(debounce);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, apiEndpoint, open, pendingOpen, staticOptions, JSON.stringify(additionalFilters)]);

  // Handle input change - only update search query when user is typing
  const handleInputChange = (
    _event: React.SyntheticEvent,
    newInputValue: string,
    reason: string
  ) => {
    // Only search when user is typing, not when selecting or resetting
    if (reason === 'input') {
      setSearchQuery(newInputValue);
    }
  };

  const fetchMoreOptions = async () => {
    if (loadingMore || !hasMore || staticOptions) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const params: Record<string, any> = { search: searchQuery, page_size: PAGE_SIZE, page: nextPage };
      if (additionalFilters) Object.assign(params, additionalFilters);
      const response = await apiClient.get(apiEndpoint, { params });
      const data = response.data.results || response.data;
      const newItems = Array.isArray(data) ? data : [];
      setOptions((prev) => {
        const existingIds = new Set(prev.map((o) => o.id));
        const unique = newItems.filter((item: DropdownOption) => !existingIds.has(item.id));
        return [...prev, ...unique];
      });
      setPage(nextPage);
      const count = response.data.count;
      if (count != null) {
        setHasMore(options.length + newItems.length < count);
      } else {
        setHasMore(response.data.next != null);
      }
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleListboxScroll = (event: React.SyntheticEvent) => {
    const listbox = event.currentTarget;
    if (listbox.scrollTop + listbox.clientHeight >= listbox.scrollHeight - 10) {
      fetchMoreOptions();
    }
  };

  // Reset search when dropdown opens
  const handleOpen = () => {
    setSearchQuery('');
    setPage(1);
    setHasMore(false);
    if (staticOptions || options.length > 0) {
      setOpen(true);
      return;
    }
    setPendingOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setPendingOpen(false);
  };

  return (
    <Autocomplete<DropdownOption, boolean, false, false>
      fullWidth
      open={open}
      onOpen={handleOpen}
      onClose={handleClose}
      multiple={multiple}
      options={Array.isArray(resolvedOptions) ? resolvedOptions : []}
      filterOptions={(x) => staticOptions ? x.filter(opt => 
        String((opt as any)?.[labelKey] || (opt as any)?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
      ) : x}
      value={multiple ? (Array.isArray(value) ? value : []) : (value as DropdownOption | null)}
      onChange={(_, newValue) => onChange(newValue as DropdownValue)}
      onInputChange={handleInputChange}
      getOptionLabel={(option) => {
        if (typeof option === 'object' && option !== null) {
          return getDisplayLabel(option as any);
        }
        return String(option || '');
      }}
      renderOption={(props, option) => {
        const { key, ...otherProps } = props;
        const display = getDisplayLabel(option as any);
        return <li key={key} {...otherProps}>{display}</li>;
      }}
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((option, index) => {
          const { key, ...tagProps } = getTagProps({ index });
          const label = getDisplayLabel(option as any);
          return (
            <Chip
              key={key}
              {...tagProps}
              label={label}
              size="small"
              variant="filled"
              sx={{
                mr: 0.5,
                mb: 0.5,
                border: 'none',
                boxShadow: 'none',
                height: 24,
                fontSize: '0.75rem',
                backgroundColor: 'rgba(0,0,0,0.06)',
                '& .MuiChip-label': {
                  px: 0.75,
                },
              }}
            />
          );
        })
      }
      isOptionEqualToValue={(option, val) => {
        const opt = option as any;
        const singleVal = val as any;
        return opt?.id === singleVal?.id;
      }}
      loading={loading || pendingOpen || loadingMore}
      ListboxProps={{
        onScroll: handleListboxScroll,
        style: { maxHeight: 252, overflow: 'auto' },
      }}
      disabled={disabled}
      componentsProps={{
        popper: {
          placement: 'bottom-start',
          modifiers: [
            {
              name: 'flip',
              enabled: false,
            },
          ],
        },
      }}
      slotProps={{
        paper: {
          sx: {
            '& .MuiAutocomplete-option': {
              '&[aria-selected="true"]': {
                backgroundColor: 'rgba(0, 103, 102, 0.08) !important',
              },
              '&.Mui-focused, &:focus': {
                backgroundColor: 'rgba(0, 103, 102, 0.12) !important',
              },
              '&:hover': {
                backgroundColor: 'rgba(0, 103, 102, 0.04) !important',
              },
            },
          },
        },
      }}
      sx={{
        '& .MuiInputBase-root': {
          minHeight: inputMinHeight,
          height: isMulti ? 'auto' : inputMinHeight,
          borderRadius: 1,
          alignItems: 'center',
        },
        '& .MuiAutocomplete-tag': {
          border: 'none !important',
          boxShadow: 'none',
        },
        '& .MuiChip-root': {
          border: 'none !important',
          boxShadow: 'none',
        },
        '& .MuiAutocomplete-input': {
          minWidth: isMulti ? 80 : undefined,
        },
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          error={error}
          helperText={helperText}
          placeholder={effectivePlaceholder}
          size={size}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
};

export default SearchableDropdown;
