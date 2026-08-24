import React, { useState, useMemo } from 'react';
import {
  Box,
  TextField,
  Typography,
  Chip,
  Paper,
  Switch,
  FormControlLabel,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Collapse,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  Shield as ShieldIcon,
} from '@mui/icons-material';
import type { ScreenItem, ScreenPermissionInput } from '../../api/users.api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PermissionAction = 'can_view' | 'can_add' | 'can_edit' | 'can_delete' | 'can_export';

const ACTIONS: Array<{ key: PermissionAction; label: string; color: string }> = [
  { key: 'can_view',   label: 'View',   color: '#1976d2' },
  { key: 'can_add',    label: 'Add',    color: '#2e7d32' },
  { key: 'can_edit',   label: 'Edit',   color: '#ed6c02' },
  { key: 'can_delete', label: 'Delete', color: '#d32f2f' },
  { key: 'can_export', label: 'Export', color: '#6a1b9a' },
];

interface ScreenPermissionPickerProps {
  /** All available screens fetched from /api/usermanagement/screens/ */
  availableScreens: ScreenItem[];
  /** Current permission state — keyed by screen_code */
  value: Record<string, ScreenPermissionInput>;
  onChange: (updated: Record<string, ScreenPermissionInput>) => void;
  disabled?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

const ScreenPermissionPicker: React.FC<ScreenPermissionPickerProps> = ({
  availableScreens: availableScreensProp,
  value,
  onChange,
  disabled = false,
}) => {
  // Guard against non-array (e.g. paginated response passed accidentally)
  const availableScreens: ScreenItem[] = Array.isArray(availableScreensProp)
    ? availableScreensProp
    : [];
  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Screens that have been added (have at least one action or appear in value map)
  const addedCodes = useMemo(() => Object.keys(value), [value]);

  // Screens available to add — not yet added, match search
  const filteredSuggestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return availableScreens.filter(
      (s) =>
        !addedCodes.includes(s.code) &&
        (q === '' || s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q))
    );
  }, [availableScreens, addedCodes, search]);

  // Screens that are added — shown as editable rows
  const addedScreens = useMemo(
    () => availableScreens.filter((s) => addedCodes.includes(s.code)),
    [availableScreens, addedCodes]
  );

  // Add a screen with default view=true
  const handleAdd = (screen: ScreenItem) => {
    onChange({
      ...value,
      [screen.code]: {
        screen_code: screen.code,
        can_view: true,
        can_add: false,
        can_edit: false,
        can_delete: false,
        can_export: false,
      },
    });
    setSearch('');
    setDropdownOpen(false);
  };

  // Remove a screen entirely
  const handleRemove = (code: string) => {
    const next = { ...value };
    delete next[code];
    onChange(next);
  };

  // Toggle a single action flag
  const handleToggle = (code: string, action: PermissionAction, checked: boolean) => {
    const current = value[code] ?? {
      screen_code: code,
      can_view: false, can_add: false, can_edit: false, can_delete: false, can_export: false,
    };

    let next = { ...current, [action]: checked };

    // Granting any action → auto-grant view
    if (action !== 'can_view' && checked) {
      next.can_view = true;
    }

    // Revoking view → revoke all
    if (action === 'can_view' && !checked) {
      next = { ...next, can_add: false, can_edit: false, can_delete: false, can_export: false };
    }

    onChange({ ...value, [code]: next });
  };

  // Toggle all actions for a screen
  const handleToggleAll = (code: string, checked: boolean) => {
    onChange({
      ...value,
      [code]: {
        screen_code: code,
        can_view: checked,
        can_add: checked,
        can_edit: checked,
        can_delete: checked,
        can_export: checked,
      },
    });
  };

  // Check if all actions are enabled for a screen
  const isAllSelected = (perm: ScreenPermissionInput | undefined): boolean => {
    if (!perm) return false;
    return perm.can_view && perm.can_add && perm.can_edit && perm.can_delete && perm.can_export;
  };

  return (
    <Box>
      {/* ── Search input ── */}
      <Box sx={{ position: 'relative' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search and add a screen (e.g. Lead, Booking…)"
          value={search}
          disabled={disabled}
          onChange={(e) => {
            setSearch(e.target.value);
            setDropdownOpen(true);
          }}
          onFocus={() => setDropdownOpen(true)}
          onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
            endAdornment: search && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => { setSearch(''); setDropdownOpen(false); }}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* Dropdown suggestions */}
        <Collapse in={dropdownOpen && filteredSuggestions.length > 0}>
          <Paper
            elevation={4}
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 1300,
              maxHeight: 240,
              overflowY: 'auto',
              mt: 0.5,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <List dense disablePadding>
              {filteredSuggestions.map((screen) => (
                <ListItemButton
                  key={screen.code}
                  onMouseDown={() => handleAdd(screen)}
                  sx={{ py: 1 }}
                >
                  <ShieldIcon fontSize="small" sx={{ mr: 1.5, color: 'primary.main', flexShrink: 0 }} />
                  <ListItemText
                    primary={screen.name}
                    secondary={screen.code}
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Paper>
        </Collapse>

        {/* No results message */}
        <Collapse in={dropdownOpen && search.trim() !== '' && filteredSuggestions.length === 0}>
          <Paper elevation={2} sx={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1300, mt: 0.5, p: 1.5 }}>
            <Typography variant="body2" color="text.secondary" align="center">
              No matching screens found
            </Typography>
          </Paper>
        </Collapse>
      </Box>

      {/* ── Added screens ── */}
      {addedScreens.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            {addedScreens.length} screen{addedScreens.length !== 1 ? 's' : ''} assigned
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {addedScreens.map((screen) => {
              const perm = value[screen.code];
              return (
                <Paper
                  key={screen.code}
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    borderColor: 'primary.200',
                    bgcolor: 'primary.50',
                    '&:hover': { borderColor: 'primary.main' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ShieldIcon fontSize="small" sx={{ color: 'primary.main' }} />
                      <Typography variant="body2" fontWeight={600}>
                        {screen.name}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => handleRemove(screen.code)}
                      disabled={disabled}
                      title="Remove screen"
                      sx={{ color: 'error.main' }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                    {/* Select All toggle */}
                    <FormControlLabel
                      control={
                        <Switch
                          size="small"
                          checked={isAllSelected(perm)}
                          onChange={(e) => handleToggleAll(screen.code, e.target.checked)}
                          disabled={disabled}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#424242' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: '#424242',
                            },
                          }}
                        />
                      }
                      label={
                        <Typography variant="caption" fontWeight={600}>
                          All
                        </Typography>
                      }
                      sx={{ mr: 1, ml: 0 }}
                    />
                    <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                    {ACTIONS.map(({ key, label, color }) => (
                      <FormControlLabel
                        key={key}
                        control={
                          <Switch
                            size="small"
                            checked={!!perm?.[key]}
                            onChange={(e) => handleToggle(screen.code, key, e.target.checked)}
                            disabled={disabled}
                            sx={{
                              '& .MuiSwitch-switchBase.Mui-checked': { color },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                backgroundColor: color,
                              },
                            }}
                          />
                        }
                        label={
                          <Typography variant="caption" fontWeight={500}>
                            {label}
                          </Typography>
                        }
                        sx={{ mr: 0, ml: 0 }}
                      />
                    ))}
                  </Box>
                </Paper>
              );
            })}
          </Box>
        </Box>
      )}

      {addedScreens.length === 0 && (
        <Box sx={{ mt: 2, p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 1, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No screens assigned yet. Search and add screens above.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ScreenPermissionPicker;
