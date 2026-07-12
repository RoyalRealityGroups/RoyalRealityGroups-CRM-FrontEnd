import React, { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  useMediaQuery,
  useTheme,
  Slide,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { DialogProps } from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export interface ModalProps extends Omit<DialogProps, 'open' | 'onClose'> {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  footer?: React.ReactNode;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  header?: React.ReactNode;
  scrollable?: boolean;
  dividers?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium',
  footer,
  closeOnOverlayClick = false,
  closeOnEscape = false,
  showCloseButton = true,
  header,
  scrollable = true,
  dividers = true,
  ...dialogProps
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  const maxWidthMap = {
    small: 'sm' as const,
    medium: 'md' as const,
    large: 'lg' as const,
    fullscreen: 'xl' as const,
  };

  // Force fullscreen on mobile for large modals
  const shouldBeFullscreen = isMobile || (isTablet && size === 'large') || size === 'fullscreen';

  return (
    <Dialog
      open={isOpen}
      onClose={(_event, reason) => {
        if (reason === 'backdropClick' && !closeOnOverlayClick) return;
        if (reason === 'escapeKeyDown' && !closeOnEscape) return;
        onClose();
      }}
      maxWidth={shouldBeFullscreen ? false : maxWidthMap[size]}
      fullWidth
      fullScreen={shouldBeFullscreen}
      scroll={scrollable ? 'paper' : 'body'}
      TransitionComponent={isMobile ? Transition : undefined}
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby="modal-content"
      PaperProps={{
        sx: {
          m: isMobile ? 0 : 2,
          maxHeight: isMobile ? '100vh' : 'calc(100vh - 64px)',
        },
      }}
      {...dialogProps}
    >
      {(title || header || showCloseButton) && (
        <DialogTitle
          id="modal-title"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: { xs: 1.5, sm: 2 },
            px: { xs: 2, sm: 3 },
          }}
        >
          {header ? (
            <Box sx={{ flex: 1 }}>{header}</Box>
          ) : (
            <Typography 
              variant={isMobile ? 'subtitle1' : 'h6'} 
              component="div" 
              sx={{ flex: 1 }}
            >
              {title}
            </Typography>
          )}
          
          {showCloseButton && (
            <IconButton
              aria-label="close"
              onClick={onClose}
              sx={{
                color: 'text.secondary',
                ml: 1,
                minWidth: '44px',
                minHeight: '44px',
              }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
      )}

      <DialogContent
        id="modal-content"
        dividers={dividers}
        sx={{
          py: { xs: 2, sm: 3 },
          px: { xs: 2, sm: 3 },
        }}
      >
        {children}
      </DialogContent>

      {footer && (
        <DialogActions
          sx={{
            py: { xs: 1.5, sm: 2 },
            px: { xs: 2, sm: 3 },
            gap: 1,
            flexDirection: isMobile ? 'column' : 'row',
            '& > button': {
              minWidth: isMobile ? '100%' : 'auto',
              minHeight: '44px',
            },
          }}
        >
          {footer}
        </DialogActions>
      )}
    </Dialog>
  );
};

export default Modal;