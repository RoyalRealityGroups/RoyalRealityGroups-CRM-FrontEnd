import { createTheme } from '@mui/material';
import type {} from '@mui/x-data-grid/themeAugmentation';

/**
 * Royal Reality Groups — CRM theme
 *
 * Design intent: a calm, content-first B2B tool. The brand lives in the AppBar,
 * the Drawer, and the primary action color. Everything else is a neutral surface
 * so that the work — projects, leads, dashboards — gets the attention.
 *
 * Tokens:
 *  - Primary   #004B62 (deep teal) — navigation chrome, primary actions
 *  - Accent    #F9B401 (gold)      — logo, single elevated CTA per screen
 *  - Info      #2575FC (royal)     — informational chips only
 *  - Surface   #FFFFFF on #F5F7F8  — paper / page
 *  - Ink       #0B1E26             — body text
 *  - Subtle    rgba(0,75,98,0.x)   — borders, hover tints, focus rings
 */

const brand = {
  primary: '#004B62',
  primaryHover: '#003D52',
  primaryLight: '#1A6B82',
  gold: '#F9B401',
  goldSoft: 'rgba(249, 180, 1, 0.10)',
  royal: '#2575FC',
  ink: '#0B1E26',
  textSecondary: '#4A5C66',
  textDisabled: '#9AA7AE',
  border: 'rgba(0, 75, 98, 0.10)',
  borderStrong: 'rgba(0, 75, 98, 0.18)',
  hover: '#F7FAFB',
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
      main: brand.gold,
      light: '#FFC93C',
      dark: '#C68E00',
      contrastText: brand.ink,
    },
    background: { default: '#F5F7F8', paper: '#FFFFFF' },
    success: { main: '#1F9D55', light: '#3FBF76', dark: '#157A40' },
    error: { main: '#E63946', light: '#F26B72', dark: '#B21F2C' },
    warning: { main: '#E0A400', light: '#F0BA28', dark: '#B68500' },
    info: { main: brand.royal, light: '#5C97FF', dark: '#1A52BF' },
    text: {
      primary: brand.ink,
      secondary: brand.textSecondary,
      disabled: brand.textDisabled,
    },
    divider: brand.border,
  },
  typography: {
    fontFamily:
      '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: { fontWeight: 700, fontSize: '2rem', lineHeight: 1.2, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, fontSize: '1.5rem', lineHeight: 1.3, letterSpacing: '-0.01em' },
    h3: { fontWeight: 600, fontSize: '1.25rem', lineHeight: 1.35 },
    h4: { fontWeight: 600, fontSize: '1.125rem', lineHeight: 1.4 },
    h5: { fontWeight: 600, fontSize: '1rem', lineHeight: 1.5 },
    h6: { fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.5 },
    subtitle1: { fontWeight: 500, fontSize: '0.9375rem', lineHeight: 1.5 },
    subtitle2: { fontWeight: 500, fontSize: '0.8125rem', lineHeight: 1.5 },
    body1: { fontSize: '0.9375rem', lineHeight: 1.55 },
    body2: { fontSize: '0.8125rem', lineHeight: 1.55 },
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
  shape: { borderRadius: 8 },
  shadows: [
    'none',
    '0 1px 2px rgba(15, 30, 38, 0.04)',
    '0 1px 3px rgba(15, 30, 38, 0.06), 0 1px 2px rgba(15, 30, 38, 0.04)',
    '0 2px 6px rgba(15, 30, 38, 0.06), 0 1px 3px rgba(15, 30, 38, 0.04)',
    '0 4px 10px rgba(15, 30, 38, 0.06), 0 1px 3px rgba(15, 30, 38, 0.04)',
    '0 6px 14px rgba(15, 30, 38, 0.08)',
    '0 8px 18px rgba(15, 30, 38, 0.08)',
    '0 10px 22px rgba(15, 30, 38, 0.10)',
    '0 12px 26px rgba(15, 30, 38, 0.10)',
    '0 14px 30px rgba(15, 30, 38, 0.12)',
    '0 16px 34px rgba(15, 30, 38, 0.12)',
    '0 18px 38px rgba(15, 30, 38, 0.14)',
    '0 20px 42px rgba(15, 30, 38, 0.14)',
    '0 22px 46px rgba(15, 30, 38, 0.16)',
    '0 24px 50px rgba(15, 30, 38, 0.16)',
    '0 26px 54px rgba(15, 30, 38, 0.18)',
    '0 28px 58px rgba(15, 30, 38, 0.18)',
    '0 30px 62px rgba(15, 30, 38, 0.20)',
    '0 32px 66px rgba(15, 30, 38, 0.20)',
    '0 34px 70px rgba(15, 30, 38, 0.22)',
    '0 36px 74px rgba(15, 30, 38, 0.22)',
    '0 38px 78px rgba(15, 30, 38, 0.24)',
    '0 40px 82px rgba(15, 30, 38, 0.24)',
    '0 42px 86px rgba(15, 30, 38, 0.26)',
    '0 44px 90px rgba(15, 30, 38, 0.26)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFamily:
            '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          backgroundColor: '#F5F7F8',
          fontFeatureSettings: '"cv02", "cv03", "cv04", "cv11"',
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
          borderRadius: 12,
          border: `1px solid ${brand.border}`,
          boxShadow: '0 24px 48px rgba(15, 30, 38, 0.18)',
        },
      },
    },
    MuiPopover: { defaultProps: { disableScrollLock: true } },
    MuiAppBar: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          backgroundColor: brand.primary,
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
          backgroundColor: '#00212C',
          color: '#D9E4EA',
          borderRight: 'none',
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
          padding: '7px 14px',
          fontSize: '0.875rem',
          transition: 'background-color 120ms ease, border-color 120ms ease, color 120ms ease',
        },
        sizeSmall: { padding: '5px 10px', fontSize: '0.8125rem' },
        sizeLarge: { padding: '9px 18px', fontSize: '0.9375rem' },
        containedPrimary: {
          backgroundColor: brand.primary,
          '&:hover': { backgroundColor: brand.primaryHover },
        },
        containedSecondary: {
          backgroundColor: brand.gold,
          color: brand.ink,
          '&:hover': { backgroundColor: '#E0A400' },
        },
        outlined: {
          borderColor: brand.borderStrong,
          color: brand.ink,
          '&:hover': {
            borderColor: brand.primary,
            backgroundColor: 'rgba(0, 75, 98, 0.04)',
          },
        },
        outlinedPrimary: {
          borderColor: brand.borderStrong,
          color: brand.primary,
          '&:hover': {
            borderColor: brand.primary,
            backgroundColor: 'rgba(0, 75, 98, 0.04)',
          },
        },
        text: {
          color: brand.primary,
          '&:hover': { backgroundColor: 'rgba(0, 75, 98, 0.06)' },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          color: brand.textSecondary,
          transition: 'background-color 120ms ease, color 120ms ease',
          '&:hover': { backgroundColor: 'rgba(0, 75, 98, 0.06)', color: brand.primary },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          border: `1px solid ${brand.border}`,
          boxShadow: 'none',
          backgroundColor: '#FFFFFF',
          transition: 'border-color 120ms ease',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 10, backgroundImage: 'none' },
        elevation0: { border: `1px solid ${brand.border}` },
        elevation1: { boxShadow: '0 1px 2px rgba(15, 30, 38, 0.04)' },
      },
    },
    MuiTextField: { defaultProps: { variant: 'outlined', size: 'small' } },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.8125rem',
          '&.Mui-focused': { color: brand.primary },
          '&.Mui-required .MuiFormLabel-asterisk': { color: '#E63946' },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: '#FFFFFF',
          fontSize: '0.875rem',
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: brand.borderStrong },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: brand.primary,
            borderWidth: 1,
            boxShadow: '0 0 0 3px rgba(0, 75, 98, 0.10)',
          },
          '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(0, 75, 98, 0.10)' },
        },
        notchedOutline: { borderColor: brand.border },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
          fontSize: '0.75rem',
          height: 24,
          backgroundColor: 'rgba(0, 75, 98, 0.06)',
          color: brand.textSecondary,
          border: 'none',
        },
        sizeSmall: { height: 22, fontSize: '0.6875rem' },
        colorPrimary: { backgroundColor: 'rgba(0, 75, 98, 0.10)', color: brand.primary },
        colorSecondary: { backgroundColor: 'rgba(249, 180, 1, 0.16)', color: '#8A6300' },
        colorSuccess: { backgroundColor: 'rgba(31, 157, 85, 0.12)', color: '#157A40' },
        colorError: { backgroundColor: 'rgba(230, 57, 70, 0.10)', color: '#B21F2C' },
        colorWarning: { backgroundColor: 'rgba(224, 164, 0, 0.14)', color: '#8A6300' },
        colorInfo: { backgroundColor: 'rgba(37, 117, 252, 0.10)', color: '#1A52BF' },
        outlined: { backgroundColor: 'transparent', border: `1px solid ${brand.borderStrong}` },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 6,
          fontSize: '0.75rem',
          padding: '6px 10px',
          backgroundColor: '#0B1E26',
          fontWeight: 500,
          boxShadow: '0 4px 12px rgba(15, 30, 38, 0.20)',
        },
        arrow: { color: '#0B1E26' },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
          fontSize: '0.875rem',
          border: `1px solid ${brand.border}`,
        },
        standardSuccess: { backgroundColor: '#F0F9F4' },
        standardError: { backgroundColor: '#FDECEE' },
        standardWarning: { backgroundColor: '#FFF8E1' },
        standardInfo: { backgroundColor: '#EEF3FE' },
      },
    },
    MuiDivider: { styleOverrides: { root: { borderColor: brand.border } } },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#F7FAFB',
          '& .MuiTableCell-head': {
            color: brand.textSecondary,
            fontWeight: 600,
            fontSize: '0.75rem',
            letterSpacing: '0.04em',
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
          '&:hover': { backgroundColor: brand.hover },
          '&.Mui-selected': { backgroundColor: 'rgba(0, 75, 98, 0.06)' },
          '&.Mui-selected:hover': { backgroundColor: 'rgba(0, 75, 98, 0.08)' },
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: `1px solid ${brand.border}`,
          borderRadius: 8,
          backgroundColor: '#FFFFFF',
          fontSize: '0.8125rem',
        },
        columnHeaders: {
          backgroundColor: '#F7FAFB',
          color: brand.textSecondary,
          borderBottom: `1px solid ${brand.border}`,
        },
        columnHeader: {
          '&:focus, &:focus-within': { outline: 'none' },
          '& .MuiDataGrid-columnHeaderTitle': {
            fontWeight: 600,
            fontSize: '0.75rem',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          },
        },
        cell: {
          borderColor: brand.border,
          '&:focus, &:focus-within': { outline: 'none' },
        },
        row: {
          '&:hover': { backgroundColor: brand.hover },
          '&.Mui-selected': {
            backgroundColor: 'rgba(0, 75, 98, 0.06)',
            '&:hover': { backgroundColor: 'rgba(0, 75, 98, 0.08)' },
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
          fontWeight: 500,
          fontSize: '0.875rem',
          minHeight: 40,
          '&.Mui-selected': { color: brand.primary },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 40 },
        indicator: { backgroundColor: brand.primary, height: 2 },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { backgroundColor: 'rgba(0, 75, 98, 0.08)', borderRadius: 2 },
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
          margin: '1px 8px',
          padding: '8px 12px',
          '&.Mui-selected': {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            color: '#FFFFFF',
            '& .MuiListItemIcon-root': { color: '#FFFFFF' },
            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.12)' },
          },
          '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.06)' },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: { color: 'rgba(217, 228, 234, 0.85)', minWidth: 36 },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
          border: `1px solid ${brand.border}`,
          boxShadow: '0 8px 24px rgba(15, 30, 38, 0.16)',
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
          '&:hover': { backgroundColor: 'rgba(0, 75, 98, 0.06)' },
          '&.Mui-selected': { backgroundColor: 'rgba(0, 75, 98, 0.08)' },
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: { backgroundColor: 'rgba(15, 30, 38, 0.45)' },
      },
    },
  },
});

export const royalTokens = brand;
export default theme;
