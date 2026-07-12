import React from 'react';
import { Box, Typography, IconButton, Tooltip, Button } from '@mui/material';
import {
  Add as AddIcon,
  ArrowBack as BackIcon,
  Close as CancelIcon,
  Save as SaveIcon,
  Edit as EditIcon,
} from '@mui/icons-material';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  showAddButton?: boolean;
  addButtonText?: string;
  showSaveButton?: boolean;
  showCancelButton?: boolean;
  showEditButton?: boolean;
  onBack?: () => void;
  onAdd?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  onEdit?: () => void;
  loading?: boolean;
  children?: React.ReactNode;
  disableBox?: boolean;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  showBackButton = false,
  showAddButton = false,
  addButtonText,
  showSaveButton = false,
  showCancelButton = false,
  showEditButton = false,
  onBack,
  onAdd,
  onSave,
  onCancel,
  onEdit,
  loading = false,
  children,
  disableBox = false,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...(disableBox ? {} : {
          padding: 2,
          backgroundColor: 'white',
          borderBottom: '1px solid #e0e0e0',
          minHeight: '64px',
        }),
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {showBackButton && (
          <Tooltip title="Back">
            <IconButton onClick={onBack} size="small" color="primary">
              <BackIcon />
            </IconButton>
          </Tooltip>
        )}
        <Typography variant="h6" component="h1" fontWeight={600} sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
          {title}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {children}
        {showAddButton && (
          addButtonText ? (
            <Button 
              onClick={onAdd} 
              variant="contained" 
              color="primary" 
              disabled={loading}
              startIcon={<AddIcon />}
            >
              {addButtonText}
            </Button>
          ) : (
            <Tooltip title="Add">
              <IconButton onClick={onAdd} color="primary" disabled={loading}>
                <AddIcon />
              </IconButton>
            </Tooltip>
          )
        )}
        {showEditButton && (
          <Tooltip title="Edit">
            <IconButton onClick={onEdit} color="primary" disabled={loading}>
              <EditIcon />
            </IconButton>
          </Tooltip>
        )}
        {showSaveButton && (
          <Tooltip title="Save">
            <IconButton onClick={onSave} color="success" disabled={loading}>
              <SaveIcon />
            </IconButton>
          </Tooltip>
        )}
        {showCancelButton && (
          <Tooltip title="Cancel">
            <IconButton onClick={onCancel} color="error" disabled={loading}>
              <CancelIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
};

export default ScreenHeader;
