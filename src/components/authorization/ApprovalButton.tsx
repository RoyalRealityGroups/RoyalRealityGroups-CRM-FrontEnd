import { useState } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Tooltip, CircularProgress } from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { authorizationApi } from '../../api/authorization.api';
import AuthorizationStatus from './AuthorizationStatus';

interface ApprovalButtonProps {
  appLabel: string;
  modelName: string;
  instanceId: string;
  currentStatus: 0 | 1 | 2 | 3;
  currentLevel?: number;
  onApprove?: (instanceId: string) => void | Promise<void>;
  onReject?: (instanceId: string, reason: string) => void | Promise<void>;
}

export default function ApprovalButton({ appLabel, modelName, instanceId, currentStatus, currentLevel, onApprove, onReject }: ApprovalButtonProps) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState<'approve' | 'reject' | null>(null);
  const [description, setDescription] = useState('');
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const displayLevel = currentStatus === 1
    ? Math.max(1, (currentLevel || 0) + 1)
    : currentLevel;

  // Temporarily disable the authorization check to avoid SQL error
  const authCheck = { can_authorize: false };
  
  // const { data: authCheck } = useQuery({
  //   queryKey: ['canAuthorize', appLabel, modelName, instanceId],
  //   queryFn: () => authorizationApi.canAuthorize(appLabel, modelName, instanceId),
  //   enabled: currentStatus === 1,
  // });

  const { data: pendingApprovers, isLoading: loadingApprovers } = useQuery({
    queryKey: ['pendingApprovers', appLabel, modelName, instanceId],
    queryFn: () => authorizationApi.getPendingApprovers(appLabel, modelName, instanceId),
    enabled: currentStatus === 1 && tooltipOpen,
    staleTime: 60000,
  });

  const approverLabel = () => {
    if (currentStatus !== 1) return '';
    if (loadingApprovers) return 'Loading approver...';
    const approvers = pendingApprovers?.approvers || [];
    if (!approvers.length) return 'No approver found';
    return approvers.map((a) => `${a.type === 'GROUP' ? 'Group' : 'User'}: ${a.name}`).join(', ');
  };

  const approveMutation = useMutation({
    mutationFn: () => authorizationApi.approve(appLabel, modelName, { instance_id: instanceId, authorized_status: 2, description }),
    onSuccess: async () => {
      setDialogOpen(null);
      setDescription('');
      // Small delay to let backend commit the authorization change before refetching
      await new Promise((r) => setTimeout(r, 300));
      await queryClient.refetchQueries();
      onApprove?.(instanceId);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => authorizationApi.reject(appLabel, modelName, { instance_id: instanceId, authorized_status: 3, description }),
    onSuccess: async () => {
      setDialogOpen(null);
      const reason = description;
      setDescription('');
      await new Promise((r) => setTimeout(r, 300));
      await queryClient.refetchQueries();
      onReject?.(instanceId, reason);
    },
  });

  if (currentStatus === 0) return <AuthorizationStatus status={0} level={displayLevel} />;
  if (currentStatus === 2) return <AuthorizationStatus status={2} level={displayLevel} />;
  if (currentStatus === 3) return <AuthorizationStatus status={3} level={displayLevel} />;

  const canAuthorize = authCheck?.can_authorize ?? false;

  const statusChip = <AuthorizationStatus status={currentStatus} level={displayLevel} />;
  const wrappedStatus = currentStatus === 1 ? (
    <Tooltip
      title={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {loadingApprovers ? <CircularProgress size={14} color="inherit" /> : null}
          <span>{approverLabel()}</span>
        </Box>
      }
      onOpen={() => setTooltipOpen(true)}
      onClose={() => setTooltipOpen(false)}
      arrow
    >
      <span>{statusChip}</span>
    </Tooltip>
  ) : statusChip;

  if (!canAuthorize) {
    return wrappedStatus;
  }

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        {wrappedStatus}
        <Button size="small" variant="contained" color="success" startIcon={<CheckCircle />} onClick={() => setDialogOpen('approve')}>Approve</Button>
        <Button size="small" variant="outlined" color="error" startIcon={<Cancel />} onClick={() => setDialogOpen('reject')}>Reject</Button>
      </Box>

      <Dialog open={dialogOpen === 'approve'} onClose={() => setDialogOpen(null)}>
        <DialogTitle>Approve Authorization</DialogTitle>
        <DialogContent>
          <TextField fullWidth multiline rows={3} label="Comments (Optional)" value={description} onChange={(e) => setDescription(e.target.value)} sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(null)}>Cancel</Button>
          <Button onClick={() => approveMutation.mutate()} variant="contained" color="success" disabled={approveMutation.isPending}>Approve</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogOpen === 'reject'} onClose={() => setDialogOpen(null)}>
        <DialogTitle>Reject Authorization</DialogTitle>
        <DialogContent>
          <TextField fullWidth multiline rows={3} label="Reason for Rejection" value={description} onChange={(e) => setDescription(e.target.value)} required sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(null)}>Cancel</Button>
          <Button onClick={() => rejectMutation.mutate()} variant="contained" color="error" disabled={rejectMutation.isPending || !description}>Reject</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
