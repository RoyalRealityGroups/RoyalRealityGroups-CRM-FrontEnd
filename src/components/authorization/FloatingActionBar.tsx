import React from 'react';
import { Paper, Typography, Button, Box } from '@mui/material';
import { CheckCircle as ApproveIcon, Cancel as RejectIcon, Clear as ClearIcon } from '@mui/icons-material';

interface FloatingActionBarProps {
  selectedCount: number;
  onApprove: () => void;
  onReject: () => void;
  onClear: () => void;
  loading?: boolean;
}

const FloatingActionBar: React.FC<FloatingActionBarProps> = ({
  selectedCount,
  onApprove,
  onReject,
  onClear,
  loading = false,
}) => {
  if (selectedCount === 0) return null;

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        mb: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        backgroundColor: '#f5f5f5',
        borderLeft: '4px solid #006766',
      }}
    >
      <Typography variant="body1" fontWeight={500}>
        {selectedCount} record{selectedCount > 1 ? 's' : ''} selected
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <Button
          variant="contained"
          color="success"
          startIcon={<ApproveIcon />}
          onClick={onApprove}
          disabled={loading}
        >
          Approve Selected
        </Button>
        
        <Button
          variant="contained"
          color="error"
          startIcon={<RejectIcon />}
          onClick={onReject}
          disabled={loading}
        >
          Reject Selected
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<ClearIcon />}
          onClick={onClear}
          disabled={loading}
        >
          Clear
        </Button>
      </Box>
    </Paper>
  );
};

export default FloatingActionBar;
