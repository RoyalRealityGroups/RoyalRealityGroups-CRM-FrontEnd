import { createTheme } from '@mui/material';
import type {} from '@mui/x-data-grid/themeAugmentation';

/**
 * Royal Reality Groups — Premium CRM Theme (Indigo & Mint Light Edition)
 *
 * Design intent: A highly modern, crisp light SaaS dashboard identity.
 * Both the top navigation header and sidebar are completely light-themed (#FFFFFF)
 * with thin elegant borders, following premium minimalist design patterns.
 */

const brand = {
  primary: '#4F46E5',
  primaryHover: '#4338CA',
  primaryLight: '#6366F1',
  mint: '#10B981',
  mintSoft: 'rgba(16, 185, 129, 0.10)',
  cyan: '#06B6D4',
  ink: '#0F172A',
  textSecondary: '#475569',
  textDisabled: '#94A3B8',
  border: 'rgba(15, 23, 42, 0.06)',
  borderStrong: 'rgba(15, 23, 42, 0.12)',
  hover: '#F8FAFC',
} as const;

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: brand.primary,
      light: brand.primaryLight,
      dark: brand.primaryHover,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: brand.mint,
      light: '#34D399',
      dark: '#059669',
      contrastText: '#FFFFFF',
    },
    background: { default: '#F8FAFC', paper: '#FFFFFF' },
    success: { main: '#10B981', light: '#34D399', dark: '#047857' },
    error: { main: '#EF4444', light: '#F87171', dark: '#B91C1C' },
    warning: { main: '#F59E0B', light: '#FBBF24', dark: '#B45309' },
    info: { main: brand.cyan, light: '#22D3EE', dark: '#0E7490' },
    text: {
      primary: brand.ink,
      secondary: brand.textSecondary,
      disabled: brand.textDisabled,
    },
    divider: brand.border,
  },
  typography: {
    fontFamily:
      '"Plus Jakarta Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: { fontFamily: '"Outfit", sans-serif', fontWeight: 700, fontSize: '2.25rem', lineHeight: 1.2, letterSpacing: '-0.02em' },
    h2: { fontFamily: '"Outfit", sans-serif', fontWeight: 700, fontSize: '1.75rem', lineHeight: 1.3, letterSpacing: '-0.01em' },
    h3: { fontFamily: '"Outfit", sans-serif', fontWeight: 600, fontSize: '1.375rem', lineHeight: 1.35 },
    h4: { fontFamily: '"Outfit", sans-serif', fontWeight: 600, fontSize: '1.125rem', lineHeight: 1.4 },
    h5: { fontFamily: '"Outfit", sans-serif', fontWeight: 600, fontSize: '1rem', lineHeight: 1.5 },
    h6: { fontFamily: '"Outfit", sans-serif', fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.5 },
    subtitle1: { fontWeight: 500, fontSize: '0.9375rem', lineHeight: 1.5 },
    subtitle2: { fontWeight: 500, fontSize: '0.8125rem', lineHeight: 1.5 },
    body1: { fontSize: '0.9375rem', lineHeight: 1.6 },
    body2: { fontSize: '0.8125rem', lineHeight: 1.6 },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0 },
    caption: { fontSize: '0.75rem', lineHeight: 1.5, color: brand.textSecondary },
    overline: {
      fontWeight: 600,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      fontSize: '0.6875rem',
      color: brand.textSecondary,
    },
  },
  shape: { borderRadius: 10 },
  shadows: [
    'none',
    '0 1px 2px rgba(15, 23, 42, 0.02)',
    '0 2px 4px rgba(15, 23, 42, 0.03)',
    '0 4px 8px rgba(15, 23, 42, 0.04)',
    '0 8px 16px rgba(15, 23, 42, 0.04)',
    '0 12px 24px rgba(15, 23, 42, 0.05)',
    '0 16px 32px rgba(15, 23, 42, 0.05)',
    '0 20px 40px rgba(15, 23, 42, 0.06)',
    '0 24px 48px rgba(15, 23, 42, 0.06)',
    '0 28px 56px rgba(15, 23, 42, 0.07)',
    '0 32px 64px rgba(15, 23, 42, 0.07)',
    '0 36px 72px rgba(15, 23, 42, 0.08)',
    '0 40px 80px rgba(15, 23, 42, 0.08)',
    '0 44px 88px rgba(15, 23, 42, 0.09)',
    '0 48px 96px rgba(15, 23, 42, 0.09)',
    '0 52px 104px rgba(15, 23, 42, 0.10)',
    '0 56px 112px rgba(15, 23, 42, 0.10)',
    '0 60px 120px rgba(15, 23, 42, 0.11)',
    '0 64px 128px rgba(15, 23, 42, 0.11)',
    '0 68px 136px rgba(15, 23, 42, 0.12)',
    '0 72px 144px rgba(15, 23, 42, 0.12)',
    '0 76px 152px rgba(15, 23, 42, 0.13)',
    '0 80px 160px rgba(15, 23, 42, 0.13)',
    '0 84px 168px rgba(15, 23, 42, 0.14)',
    '0 88px 176px rgba(15, 23, 42, 0.14)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFamily:
            '"Plus Jakarta Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          backgroundColor: '#F8FAFC',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
      },
    },
    MuiModal: {
      defaultProps: {
        disableScrollLock: true,
        disableEnforceFocus: true,
        disableAutoFocus: true,
        disableRestoreFocus: true,
        container: () => document.body,
      },
    },
    MuiDialog: {
      defaultProps: {
        disableScrollLock: true,
        disableEnforceFocus: true,
        disableAutoFocus: true,
        disableRestoreFocus: true,
        container: () => document.body,
      },
      styleOverrides: {
        paper: {
          borderRadius: 14,
          border: `1px solid ${brand.border}`,
          boxShadow: '0 12px 36px rgba(15, 23, 42, 0.08)',
        },
      },
    },
    MuiPopover: { defaultProps: { disableScrollLock: true } },
    MuiAppBar: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          backgroundColor: '#FFFFFF',
          color: brand.ink,
          boxShadow: 'none',
          borderBottom: `1px solid ${brand.border}`,
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: { minHeight: 56, '@media (min-width:600px)': { minHeight: 60 } },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FFFFFF',
          color: brand.ink,
          borderRight: `1px solid ${brand.border}`,
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true, disableRipple: false },
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          padding: '8px 16px',
          fontSize: '0.875rem',
          transition: 'all 0.15s ease-in-out',
        },
        sizeSmall: { padding: '6px 12px', fontSize: '0.8125rem' },
        sizeLarge: { padding: '10px 20px', fontSize: '0.9375rem' },
        containedPrimary: {
          backgroundColor: brand.primary,
          '&:hover': {
            backgroundColor: brand.primaryHover,
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.15)',
          },
        },
        containedSecondary: {
          backgroundColor: brand.mint,
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#059669',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
          },
        },
        outlined: {
          borderColor: brand.borderStrong,
          color: brand.ink,
          '&:hover': {
            borderColor: brand.primary,
            backgroundColor: 'rgba(79, 70, 229, 0.04)',
          },
        },
        outlinedPrimary: {
          borderColor: brand.borderStrong,
          color: brand.primary,
          '&:hover': {
            borderColor: brand.primary,
            backgroundColor: 'rgba(79, 70, 229, 0.04)',
          },
        },
        text: {
          color: brand.primary,
          '&:hover': { backgroundColor: 'rgba(79, 70, 229, 0.06)' },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          color: brand.textSecondary,
          transition: 'all 0.15s ease',
          '&:hover': { backgroundColor: 'rgba(79, 70, 229, 0.06)', color: brand.primary },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: `1px solid ${brand.border}`,
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.01)',
          backgroundColor: '#FFFFFF',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: brand.borderStrong,
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.03)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 12, backgroundImage: 'none' },
        elevation0: { border: `1px solid ${brand.border}` },
        elevation1: { boxShadow: '0 4px 12px rgba(15, 23, 42, 0.01)' },
      },
    },
    MuiTextField: { defaultProps: { variant: 'outlined', size: 'small' } },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.8125rem',
          '&.Mui-focused': { color: brand.primary },
          '&.Mui-required .MuiFormLabel-asterisk': { color: '#EF4444' },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: '#FFFFFF',
          fontSize: '0.875rem',
          transition: 'all 0.15s ease',
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: brand.borderStrong },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: brand.primary,
            borderWidth: 1.5,
            boxShadow: '0 0 0 3px rgba(79, 70, 229, 0.08)',
          },
        },
        notchedOutline: { borderColor: brand.border },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 600,
          fontSize: '0.75rem',
          height: 24,
          backgroundColor: 'rgba(15, 23, 42, 0.04)',
          color: brand.textSecondary,
          border: 'none',
        },
        sizeSmall: { height: 22, fontSize: '0.6875rem' },
        colorPrimary: { backgroundColor: 'rgba(79, 70, 229, 0.08)', color: brand.primary },
        colorSecondary: { backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#059669' },
        colorSuccess: { backgroundColor: '#ECFDF5', color: '#047857' },
        colorError: { backgroundColor: '#FEF2F2', color: '#B91C1C' },
        colorWarning: { backgroundColor: '#FFFBEB', color: '#B45309' },
        colorInfo: { backgroundColor: '#ECFEFF', color: '#0E7490' },
        outlined: { backgroundColor: 'transparent', border: `1px solid ${brand.borderStrong}` },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 6,
          fontSize: '0.75rem',
          padding: '6px 10px',
          backgroundColor: '#0F172B',
          fontWeight: 500,
          boxShadow: '0 6px 16px rgba(15, 23, 42, 0.10)',
        },
        arrow: { color: '#0F172B' },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 500,
          fontSize: '0.875rem',
          border: `1px solid ${brand.border}`,
        },
        standardSuccess: { backgroundColor: '#ECFDF5', color: '#047857', borderColor: 'rgba(16, 185, 129, 0.15)' },
        standardError: { backgroundColor: '#FEF2F2', color: '#B91C1C', borderColor: 'rgba(239, 68, 68, 0.15)' },
        standardWarning: { backgroundColor: '#FFFBEB', color: '#B45309', borderColor: 'rgba(245, 158, 11, 0.15)' },
        standardInfo: { backgroundColor: '#ECFEFF', color: '#0E7490', borderColor: 'rgba(6, 182, 212, 0.15)' },
      },
    },
    MuiDivider: { styleOverrides: { root: { borderColor: brand.border } } },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#F8FAFC',
          '& .MuiTableCell-head': {
            color: brand.textSecondary,
            fontWeight: 600,
            fontSize: '0.75rem',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            borderBottom: `1px solid ${brand.border}`,
          },
        },
      },
    },
    MuiTableCell: { styleOverrides: { root: { borderColor: brand.border } } },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'all 0.15s ease',
          '&:hover': { backgroundColor: brand.hover },
          '&.Mui-selected': { backgroundColor: 'rgba(79, 70, 229, 0.05)' },
          '&.Mui-selected:hover': { backgroundColor: 'rgba(79, 70, 229, 0.07)' },
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: `1px solid ${brand.border}`,
          borderRadius: 10,
          backgroundColor: '#FFFFFF',
          fontSize: '0.8125rem',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.01)',
        },
        columnHeaders: {
          backgroundColor: '#F8FAFC',
          color: brand.textSecondary,
          borderBottom: `1px solid ${brand.border}`,
        },
        columnHeader: {
          '&:focus, &:focus-within': { outline: 'none' },
          '& .MuiDataGrid-columnHeaderTitle': {
            fontWeight: 600,
            fontSize: '0.75rem',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          },
        },
        cell: {
          borderColor: brand.border,
          '&:focus, &:focus-within': { outline: 'none' },
        },
        row: {
          transition: 'all 0.15s ease',
          '&:hover': { backgroundColor: brand.hover },
          '&.Mui-selected': {
            backgroundColor: 'rgba(79, 70, 229, 0.05)',
            '&:hover': { backgroundColor: 'rgba(79, 70, 229, 0.07)' },
          },
        },
        footerContainer: {
          borderTop: `1px solid ${brand.border}`,
          backgroundColor: '#FFFFFF',
        },
      },
    },
    MuiPagination: {
      styleOverrides: {
        root: {
          '& .MuiPaginationItem-root': { borderRadius: 6, fontWeight: 500 },
          '& .Mui-selected': {
            backgroundColor: brand.primary,
            color: '#FFFFFF',
            '&:hover': { backgroundColor: brand.primaryHover },
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.875rem',
          minHeight: 40,
          fontFamily: '"Outfit", sans-serif',
          '&.Mui-selected': { color: brand.primary },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 40 },
        indicator: { backgroundColor: brand.primary, height: 2.5 },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { backgroundColor: 'rgba(79, 70, 229, 0.08)', borderRadius: 4 },
        bar: { backgroundColor: brand.primary },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          '& .MuiSwitch-switchBase.Mui-checked': { color: brand.primary },
          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
            backgroundColor: brand.primary,
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: { '&.Mui-checked': { color: brand.primary }, padding: 8 },
      },
    },
    MuiRadio: {
      styleOverrides: {
        root: { '&.Mui-checked': { color: brand.primary } },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          margin: '2px 8px',
          padding: '8px 12px',
          color: brand.textSecondary,
          '&.Mui-selected': {
            backgroundColor: 'rgba(79, 70, 229, 0.08)',
            color: brand.primary,
            '& .MuiListItemIcon-root': { color: brand.primary },
            '&:hover': { backgroundColor: 'rgba(79, 70, 229, 0.12)' },
          },
          '&:hover': { backgroundColor: 'rgba(79, 70, 229, 0.04)', color: brand.primary, '& .MuiListItemIcon-root': { color: brand.primary } },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: { color: brand.textSecondary, minWidth: 36, transition: 'color 0.15s ease' },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
          border: `1px solid ${brand.border}`,
          boxShadow: '0 8px 24px rgba(79, 70, 229, 0.06)',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          margin: '2px 6px',
          padding: '7px 12px',
          fontSize: '0.875rem',
          '&:hover': { backgroundColor: 'rgba(79, 70, 229, 0.06)' },
          '&.Mui-selected': { backgroundColor: 'rgba(79, 70, 229, 0.08)' },
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: { backgroundColor: 'rgba(15, 23, 42, 0.15)' },
      },
    },
  },
});

export const royalTokens = brand;
export default theme;
