import React, { useEffect, useState } from 'react';
import { Alert } from '@mui/material';
import type { AlertProps } from '@mui/material/Alert';
import type { SyntheticEvent } from 'react';

const DEFAULT_DURATION = 15000; // 15 seconds

type AutoDismissAlertProps = AlertProps & {
  duration?: number | null;
};

/**
 * Auto-dismissable MUI Alert.
 * Defaults to 15s; pass duration=null to keep it open.
 */
const AutoDismissAlert: React.FC<AutoDismissAlertProps> = ({
  duration = DEFAULT_DURATION,
  onClose,
  children,
  ...rest
}) => {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (duration === null) {
      return undefined;
    }
    const timer = setTimeout(() => {
      setOpen(false);
      if (onClose) {
        onClose({} as SyntheticEvent);
      }
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!open) return null;

  return (
    <Alert
      {...rest}
      onClose={(event: SyntheticEvent) => {
        setOpen(false);
        if (onClose) {
          onClose(event);
        }
      }}
    >
      {children}
    </Alert>
  );
};

export default AutoDismissAlert;
