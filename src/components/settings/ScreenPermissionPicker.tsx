import React, { useState, useMemo } from 'react';
import {
  Box,
  TextField,
  Typography,
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
import type { MenuItem, MenuPermissionInput } from '../../api/users.api';

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
  /** All available menu items fetched from /api/system/user_menu/ */
  availableScreens: MenuItem[];
  /** Current permission state — keyed by menuitem_id */
  value: Record<number, MenuPermissionInput>;
  onChange: (updated: Record<number, MenuPermissionInput>) => void;
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
  const availableMenuItems: MenuItem[] = Array.isArray(availableScreensProp)
    ? availableScreensProp
    : [];
  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Menu items that have been added (have at least one action or appear in value map)
  const addedIds = useMemo(() => Object.keys(value).map(Number), [value]);

  // Menu items available to add — not yet added, match search
  const filteredSuggestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return availableMenuItems.filter(
      (m) =>
        !addedIds.includes(m.id) &&
        (q === '' || m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q))
    );
  }, [availableMenuItems, addedIds, search]);

  // Menu items that are added — shown as editable rows
  const addedMenuItems = useMemo(
    () => availableMenuItems.filter((m) => addedIds.includes(m.id)),
    [availableMenuItems, addedIds]
  );

  // Add a menu item with default view=true
  const handleAdd = (menuItem: MenuItem) => {
    onChange({
      ...value,
      [menuItem.id]: {
        menuitem_id: menuItem.id,
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

  // Remove a menu item entirely
  const handleRemove = (id: number) => {
    const next = { ...value };
    delete next[id];
    onChange(next);
  };

  // Toggle a single action flag
  const handleToggle = (id: number, action: PermissionAction, checked: boolean) => {
    const current = value[id] ?? {
      menuitem_id: id,
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

    onChange({ ...value, [id]: next });
  };

  // Toggle all actions for a menu item
  const handleToggleAll = (id: number, checked: boolean) => {
    onChange({
      ...value,
      [id]: {
        menuitem_id: id,
        can_view: checked,
        can_add: checked,
        can_edit: checked,
        can_delete: checked,
        can_export: checked,
      },
    });
  };

  // Check if all actions are enabled for a menu item
  const isAllSelected = (perm: MenuPermissionInput | undefined): boolean => {
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
              {filteredSuggestions.map((menuItem) => (
                <ListItemButton
                  key={menuItem.id}
                  onMouseDown={() => handleAdd(menuItem)}
                  sx={{ py: 1 }}
                >
                  <ShieldIcon fontSize="small" sx={{ mr: 1.5, color: 'primary.main', flexShrink: 0 }} />
                  <ListItemText
                    primary={menuItem.name}
                    secondary={menuItem.code}
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

      {/* ── Added menu items ── */}
      {addedMenuItems.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            {addedMenuItems.length} screen{addedMenuItems.length !== 1 ? 's' : ''} assigned
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {addedMenuItems.map((menuItem) => {
              const perm = value[menuItem.id];
              return (
                <Paper
                  key={menuItem.id}
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
                        {menuItem.name}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => handleRemove(menuItem.id)}
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
                          onChange={(e) => handleToggleAll(menuItem.id, e.target.checked)}
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
                            onChange={(e) => handleToggle(menuItem.id, key, e.target.checked)}
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

      {addedMenuItems.length === 0 && (
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
