/**
 * Consistent spacing constants for the entire application
 * Use these values to maintain uniform spacing across all screens
 */

// Page-level spacing
export const PAGE_SPACING = {
  TOP: 3,
  HORIZONTAL: 3,
  BOTTOM: 4,
  HEADER_TOP: 1,
  HEADER_BOTTOM: 1.5,
  GAP: 2,
  GAP_LARGE: 3,
  SECTION_MARGIN: 3,
};

// DataGrid/Table styling
export const TABLE_STYLES = {
  HEADER_BG_COLOR: '#006766',
  HEADER_TEXT_COLOR: '#ffffff',
  ROW_HOVER_COLOR: 'rgba(0, 103, 102, 0.04)',
};

// Common page container styles
export const getPageContainerStyles = () => ({
  display: 'flex',
  flexDirection: 'column' as const,
  height: '100%',
  overflow: 'hidden',
});

// Common header section styles
export const getHeaderSectionStyles = () => ({
  flexShrink: 0,
  position: 'sticky' as const,
  top: 0,
  zIndex: 1000,
  bgcolor: '#f5f5f5',
  px: { xs: 1, sm: 1.5, md: PAGE_SPACING.HORIZONTAL },
  pt: PAGE_SPACING.HEADER_TOP,
  pb: PAGE_SPACING.HEADER_BOTTOM,
});

// Common content section styles (scrollable)
export const getContentSectionStyles = () => ({
  flexGrow: 1,
  px: { xs: 0.5, sm: 1.5, md: PAGE_SPACING.HORIZONTAL },
  pb: PAGE_SPACING.BOTTOM,
  overflow: 'auto',
  display: 'flex',
  flexDirection: 'column' as const,
  position: 'relative' as const,
  zIndex: 1,
});

// Common container styles for hub pages (Dashboard, MastersHub, etc.)
export const getHubContainerStyles = () => ({
  mt: { xs: 1.5, md: PAGE_SPACING.TOP },
  mb: PAGE_SPACING.BOTTOM,
  px: { xs: 1, sm: 1.5, md: PAGE_SPACING.HORIZONTAL },
});

// DataGrid common styles
// Application default color
export const APP_PRIMARY_COLOR = '#006766';

export const getDataGridStyles = () => ({
  border: 0,
  borderRadius: 0,
  height: '100%',
  fontFamily: 'Poppins, sans-serif',
  '& .MuiDataGrid-root': {
    borderRadius: 0,
    fontFamily: 'Poppins, sans-serif',
  },
  '& .MuiDataGrid-main': {
    borderRadius: 0,
  },
  '& .MuiDataGrid-virtualScroller': {
    borderRadius: 0,
  },
  '& .MuiDataGrid-columnHeaders': {
    backgroundColor: TABLE_STYLES.HEADER_BG_COLOR,
    color: TABLE_STYLES.HEADER_TEXT_COLOR,
    fontSize: '0.875rem',
    fontWeight: 600,
    borderRadius: 0,
    fontFamily: 'Poppins, sans-serif',
  },
  '& .MuiDataGrid-columnHeader': {
    backgroundColor: TABLE_STYLES.HEADER_BG_COLOR,
    borderRadius: 0,
    '&:focus': {
      outline: 'none',
    },
    '&:focus-within': {
      outline: 'none',
    },
  },
  '& .MuiDataGrid-columnHeaderTitle': {
    fontWeight: 600,
    fontFamily: 'Poppins, sans-serif',
  },
  '& .MuiDataGrid-cell': {
    fontSize: '0.875rem',
    fontFamily: 'Poppins, sans-serif',
    display: 'flex',
    alignItems: 'center',
  },
  '& .MuiDataGrid-row': {
    maxHeight: 'none !important',
  },
  '& .MuiDataGrid-cell--withRenderer': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  '& .MuiDataGrid-sortIcon': {
    opacity: '0 !important',
    display: 'none !important',
    visibility: 'hidden !important',
  },
  '& .MuiDataGrid-columnHeader:hover .MuiDataGrid-sortIcon': {
    opacity: '0 !important',
    display: 'none !important',
    visibility: 'hidden !important',
  },
  '& .MuiDataGrid-columnHeader--sorted .MuiDataGrid-sortIcon': {
    opacity: '0 !important',
    display: 'none !important',
    visibility: 'hidden !important',
  },
  '& .MuiDataGrid-iconButtonContainer': {
    visibility: 'hidden !important',
    width: '0 !important',
  },
  '& .MuiDataGrid-menuIconButton': {
    color: TABLE_STYLES.HEADER_TEXT_COLOR,
    opacity: 0,
    transition: 'opacity 0.2s',
  },
  '& .MuiDataGrid-columnHeader:hover .MuiDataGrid-menuIconButton': {
    opacity: 0,
  },
  '& .MuiDataGrid-columnSeparator': {
    color: 'rgba(255, 255, 255, 0.3)',
  },
  '& .MuiDataGrid-cell:focus': {
    outline: 'none',
  },
  '& .MuiDataGrid-row:hover': {
    backgroundColor: TABLE_STYLES.ROW_HOVER_COLOR,
  },
  '& .MuiDataGrid-footerContainer': {
    borderRadius: 0,
    fontFamily: 'Poppins, sans-serif',
  },
  // Loading overlay styling with app primary color
  '& .MuiDataGrid-overlay': {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  '& .MuiCircularProgress-root': {
    color: APP_PRIMARY_COLOR,
  },
});
