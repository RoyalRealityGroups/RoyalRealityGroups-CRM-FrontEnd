import { createTheme } from '@mui/material';
import type {} from '@mui/x-data-grid/themeAugmentation';
import {
  type ThemeTokens, DEFAULT_THEME_TOKENS,
  hexToRgba, darken, lighten,
} from './themeTokens';

/**
 * Royal Reality Groups — Dynamic CRM Theme factory.
 *
 * createAppTheme(tokens) builds the full MUI theme from a small set of
 * configurable tokens (colors + fonts) managed in Settings → Appearance.
 * All brand values are derived from the tokens so the entire app re-skins
 * when an admin changes them.
 */
export function createAppTheme(tokens: ThemeTokens = DEFAULT_THEME_TOKENS) {
  const t = { ...DEFAULT_THEME_TOKENS, ...tokens };

  const brand = {
    primary: t.primary_color,
    primaryHover: darken(t.primary_color, 0.12),
    primaryLight: lighten(t.primary_color, 0.15),
    mint: t.secondary_color,
    cyan: t.info_color,
    ink: t.text_primary_color,
    textSecondary: t.text_secondary_color,
    textDisabled: hexToRgba(t.text_secondary_color, 0.6),
    border: hexToRgba(t.text_primary_color, 0.06),
    borderStrong: hexToRgba(t.text_primary_color, 0.12),
    hover: hexToRgba(t.text_primary_color, 0.02),
  };

  const headingFont = `"${t.heading_font}", sans-serif`;
  const bodyFont = `"${t.body_font}", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  const radius = t.border_radius;

  const primarySoft = hexToRgba(brand.primary, 0.08);
  const primarySoft04 = hexToRgba(brand.primary, 0.04);
  const primarySoft06 = hexToRgba(brand.primary, 0.06);

  return createTheme({
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
        light: lighten(brand.mint, 0.15),
        dark: darken(brand.mint, 0.12),
        contrastText: '#FFFFFF',
      },
      background: { default: t.background_color, paper: t.paper_color },
      success: { main: t.success_color, light: lighten(t.success_color, 0.15), dark: darken(t.success_color, 0.2) },
      error: { main: t.error_color, light: lighten(t.error_color, 0.15), dark: darken(t.error_color, 0.2) },
      warning: { main: t.warning_color, light: lighten(t.warning_color, 0.15), dark: darken(t.warning_color, 0.2) },
      info: { main: brand.cyan, light: lighten(brand.cyan, 0.15), dark: darken(brand.cyan, 0.2) },
      text: {
        primary: brand.ink,
        secondary: brand.textSecondary,
        disabled: brand.textDisabled,
      },
      divider: brand.border,
    },
    typography: {
      fontFamily: bodyFont,
      h1: { fontFamily: headingFont, fontWeight: 700, fontSize: '2.25rem', lineHeight: 1.2, letterSpacing: '-0.02em' },
      h2: { fontFamily: headingFont, fontWeight: 700, fontSize: '1.75rem', lineHeight: 1.3, letterSpacing: '-0.01em' },
      h3: { fontFamily: headingFont, fontWeight: 600, fontSize: '1.375rem', lineHeight: 1.35 },
      h4: { fontFamily: headingFont, fontWeight: 600, fontSize: '1.125rem', lineHeight: 1.4 },
      h5: { fontFamily: headingFont, fontWeight: 600, fontSize: '1rem', lineHeight: 1.5 },
      h6: { fontFamily: headingFont, fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.5 },
      subtitle1: { fontWeight: 500, fontSize: '0.9375rem', lineHeight: 1.5 },
      subtitle2: { fontWeight: 500, fontSize: '0.8125rem', lineHeight: 1.5 },
      body1: { fontSize: '0.9375rem', lineHeight: 1.6 },
      body2: { fontSize: '0.8125rem', lineHeight: 1.6 },
      button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0 },
      caption: { fontSize: '0.75rem', lineHeight: 1.5, color: brand.textSecondary },
      overline: {
        fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
        fontSize: '0.6875rem', color: brand.textSecondary,
      },
    },
    shape: { borderRadius: radius },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            fontFamily: bodyFont,
            backgroundColor: t.background_color,
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
          },
        },
      },
      MuiModal: {
        defaultProps: {
          disableScrollLock: true, disableEnforceFocus: true,
          disableAutoFocus: true, disableRestoreFocus: true,
          container: () => document.body,
        },
      },
      MuiDialog: {
        defaultProps: {
          disableScrollLock: true, disableEnforceFocus: true,
          disableAutoFocus: true, disableRestoreFocus: true,
          container: () => document.body,
        },
        styleOverrides: {
          paper: {
            borderRadius: radius + 4,
            border: `1px solid ${brand.border}`,
            boxShadow: '0 12px 36px rgba(15, 23, 42, 0.08)',
          },
        },
      },
      MuiPopover: { defaultProps: { disableScrollLock: true } },
      MuiAppBar: {
        styleOverrides: {
          root: {
            borderRadius: 0, backgroundColor: t.paper_color, color: brand.ink,
            boxShadow: 'none', borderBottom: `1px solid ${brand.border}`,
          },
        },
      },
      MuiToolbar: {
        styleOverrides: { root: { minHeight: 56, '@media (min-width:600px)': { minHeight: 60 } } },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: { backgroundColor: t.paper_color, color: brand.ink, borderRight: `1px solid ${brand.border}` },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true, disableRipple: false },
        styleOverrides: {
          root: {
            textTransform: 'none', fontWeight: 600, borderRadius: Math.max(6, radius - 2),
            padding: '8px 16px', fontSize: '0.875rem', transition: 'all 0.15s ease-in-out',
          },
          sizeSmall: { padding: '6px 12px', fontSize: '0.8125rem' },
          sizeLarge: { padding: '10px 20px', fontSize: '0.9375rem' },
          containedPrimary: {
            backgroundColor: brand.primary,
            '&:hover': { backgroundColor: brand.primaryHover, boxShadow: `0 4px 12px ${hexToRgba(brand.primary, 0.15)}` },
          },
          containedSecondary: {
            backgroundColor: brand.mint, color: '#FFFFFF',
            '&:hover': { backgroundColor: darken(brand.mint, 0.12), boxShadow: `0 4px 12px ${hexToRgba(brand.mint, 0.2)}` },
          },
          outlined: {
            borderColor: brand.borderStrong, color: brand.ink,
            '&:hover': { borderColor: brand.primary, backgroundColor: primarySoft04 },
          },
          outlinedPrimary: {
            borderColor: brand.borderStrong, color: brand.primary,
            '&:hover': { borderColor: brand.primary, backgroundColor: primarySoft04 },
          },
          text: { color: brand.primary, '&:hover': { backgroundColor: primarySoft06 } },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: Math.max(6, radius - 2), color: brand.textSecondary, transition: 'all 0.15s ease',
            '&:hover': { backgroundColor: primarySoft06, color: brand.primary },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: radius + 2, border: `1px solid ${brand.border}`,
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.01)', backgroundColor: t.paper_color,
            transition: 'all 0.2s ease',
            '&:hover': { borderColor: brand.borderStrong, boxShadow: '0 8px 24px rgba(15, 23, 42, 0.03)' },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { borderRadius: radius + 2, backgroundImage: 'none' },
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
            '&.Mui-required .MuiFormLabel-asterisk': { color: t.error_color },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: Math.max(6, radius - 2), backgroundColor: t.paper_color, fontSize: '0.875rem',
            transition: 'all 0.15s ease',
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: brand.borderStrong },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: brand.primary, borderWidth: 1.5,
              boxShadow: `0 0 0 3px ${hexToRgba(brand.primary, 0.08)}`,
            },
          },
          notchedOutline: { borderColor: brand.border },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6, fontWeight: 600, fontSize: '0.75rem', height: 24,
            backgroundColor: hexToRgba(brand.ink, 0.04), color: brand.textSecondary, border: 'none',
          },
          sizeSmall: { height: 22, fontSize: '0.6875rem' },
          colorPrimary: { backgroundColor: primarySoft, color: brand.primary },
          colorSecondary: { backgroundColor: hexToRgba(brand.mint, 0.12), color: darken(brand.mint, 0.12) },
          outlined: { backgroundColor: 'transparent', border: `1px solid ${brand.borderStrong}` },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            borderRadius: 6, fontSize: '0.75rem', padding: '6px 10px',
            backgroundColor: brand.ink, fontWeight: 500, boxShadow: '0 6px 16px rgba(15, 23, 42, 0.10)',
          },
          arrow: { color: brand.ink },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: radius, fontWeight: 500, fontSize: '0.875rem', border: `1px solid ${brand.border}` },
          standardSuccess: { backgroundColor: hexToRgba(t.success_color, 0.10), color: darken(t.success_color, 0.25) },
          standardError: { backgroundColor: hexToRgba(t.error_color, 0.08), color: darken(t.error_color, 0.25) },
          standardWarning: { backgroundColor: hexToRgba(t.warning_color, 0.10), color: darken(t.warning_color, 0.3) },
          standardInfo: { backgroundColor: hexToRgba(t.info_color, 0.10), color: darken(t.info_color, 0.25) },
        },
      },
      MuiDivider: { styleOverrides: { root: { borderColor: brand.border } } },
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: t.background_color,
            '& .MuiTableCell-head': {
              color: brand.textSecondary, fontWeight: 600, fontSize: '0.75rem',
              letterSpacing: '0.05em', textTransform: 'uppercase', borderBottom: `1px solid ${brand.border}`,
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
            '&.Mui-selected': { backgroundColor: hexToRgba(brand.primary, 0.05) },
            '&.Mui-selected:hover': { backgroundColor: hexToRgba(brand.primary, 0.07) },
          },
        },
      },
      MuiDataGrid: {
        styleOverrides: {
          root: {
            border: `1px solid ${brand.border}`, borderRadius: radius, backgroundColor: t.paper_color,
            fontSize: '0.8125rem', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.01)',
          },
          columnHeaders: {
            backgroundColor: t.background_color, color: brand.textSecondary, borderBottom: `1px solid ${brand.border}`,
          },
          columnHeader: {
            '&:focus, &:focus-within': { outline: 'none' },
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase',
            },
          },
          cell: { borderColor: brand.border, '&:focus, &:focus-within': { outline: 'none' } },
          row: {
            transition: 'all 0.15s ease',
            '&:hover': { backgroundColor: brand.hover },
            '&.Mui-selected': {
              backgroundColor: hexToRgba(brand.primary, 0.05),
              '&:hover': { backgroundColor: hexToRgba(brand.primary, 0.07) },
            },
          },
          footerContainer: { borderTop: `1px solid ${brand.border}`, backgroundColor: t.paper_color },
        },
      },
      MuiPagination: {
        styleOverrides: {
          root: {
            '& .MuiPaginationItem-root': { borderRadius: 6, fontWeight: 500 },
            '& .Mui-selected': {
              backgroundColor: brand.primary, color: '#FFFFFF',
              '&:hover': { backgroundColor: brand.primaryHover },
            },
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none', fontWeight: 600, fontSize: '0.875rem', minHeight: 40,
            fontFamily: headingFont, '&.Mui-selected': { color: brand.primary },
          },
        },
      },
      MuiTabs: {
        styleOverrides: { root: { minHeight: 40 }, indicator: { backgroundColor: brand.primary, height: 2.5 } },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: { backgroundColor: primarySoft, borderRadius: 4 },
          bar: { backgroundColor: brand.primary },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          root: {
            '& .MuiSwitch-switchBase.Mui-checked': { color: brand.primary },
            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: brand.primary },
          },
        },
      },
      MuiCheckbox: { styleOverrides: { root: { '&.Mui-checked': { color: brand.primary }, padding: 8 } } },
      MuiRadio: { styleOverrides: { root: { '&.Mui-checked': { color: brand.primary } } } },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 6, margin: '2px 8px', padding: '8px 12px', color: brand.textSecondary,
            '&.Mui-selected': {
              backgroundColor: primarySoft, color: brand.primary,
              '& .MuiListItemIcon-root': { color: brand.primary },
              '&:hover': { backgroundColor: hexToRgba(brand.primary, 0.12) },
            },
            '&:hover': {
              backgroundColor: primarySoft04, color: brand.primary,
              '& .MuiListItemIcon-root': { color: brand.primary },
            },
          },
        },
      },
      MuiListItemIcon: {
        styleOverrides: { root: { color: brand.textSecondary, minWidth: 36, transition: 'color 0.15s ease' } },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: Math.max(6, radius - 2), border: `1px solid ${brand.border}`,
            boxShadow: `0 8px 24px ${hexToRgba(brand.primary, 0.06)}`,
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            borderRadius: 6, margin: '2px 6px', padding: '7px 12px', fontSize: '0.875rem',
            '&:hover': { backgroundColor: primarySoft06 },
            '&.Mui-selected': { backgroundColor: primarySoft },
          },
        },
      },
      MuiBackdrop: { styleOverrides: { root: { backgroundColor: 'rgba(15, 23, 42, 0.15)' } } },
    },
  });
}

// Default theme instance (used as a fallback before backend tokens load).
export const theme = createAppTheme(DEFAULT_THEME_TOKENS);

export default theme;
