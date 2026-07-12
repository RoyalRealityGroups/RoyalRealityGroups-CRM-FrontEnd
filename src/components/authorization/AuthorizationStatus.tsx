import { Chip } from '@mui/material';
import { CheckCircle, HourglassEmpty, Cancel } from '@mui/icons-material';

interface AuthorizationStatusProps {
  status: 0 | 1 | 2 | 3;
  level?: number;
}

export default function AuthorizationStatus({ status, level }: AuthorizationStatusProps) {
  const statusConfig = {
    0: { label: 'Draft', color: 'default' as const, icon: <HourglassEmpty fontSize="small" /> },
    1: { label: 'Pending', color: 'warning' as const, icon: <HourglassEmpty fontSize="small" /> },
    2: { label: 'Approved', color: 'success' as const, icon: <CheckCircle fontSize="small" /> },
    3: { label: 'Rejected', color: 'error' as const, icon: <Cancel fontSize="small" /> },
  };

  const config = statusConfig[status];
  const label = level ? `${config.label} (L${level})` : config.label;

  return <Chip label={label} color={config.color} icon={config.icon} size="small" />;
}
