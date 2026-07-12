import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  IconButton,
  InputAdornment,
  Alert,
  Typography,
} from '@mui/material';
import {
  Close as CloseIcon,
  Visibility,
  VisibilityOff,
  Lock as LockIcon,
} from '@mui/icons-material';
import { Button, TextField } from '../common';
import { authApi } from '../../api/auth.api';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';

interface ChangePasswordDialogProps {
  open: boolean;
  onClose: () => void;
}

const ChangePasswordDialog: React.FC<ChangePasswordDialogProps> = ({ open, onClose }) => {
  const { logout } = useAuth();
  const { success: toastSuccess } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingPassword, setIsValidatingPassword] = useState(false);
  const [isCurrentPasswordValid, setIsCurrentPasswordValid] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState({
    old_password: '',
    password: '',
    confirm_password: '',
  });

  const [errors, setErrors] = useState({
    old_password: '',
    password: '',
    confirm_password: '',
    general: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Reset current password validation if user changes it
    if (name === 'old_password') {
      setIsCurrentPasswordValid(false);
    }
    
    // Clear error when user types
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: '', general: '' }));
    }
  };

  const validateCurrentPassword = async () => {
    
    if (!formData.old_password) {
      setErrors((prev) => ({ ...prev, old_password: 'Current password is required' }));
      return;
    }

    if (formData.old_password.length < 4) {
      setErrors((prev) => ({ ...prev, old_password: 'Password must be at least 4 characters' }));
      return;
    }

    setIsValidatingPassword(true);
    setErrors((prev) => ({ ...prev, old_password: '', general: '' }));

    try {
      // Call the dedicated validation endpoint
      const response = await authApi.validateCurrentPassword(formData.old_password);
      
      // Password is valid
      setIsCurrentPasswordValid(true);
    } catch (err: any) {
      // Password is invalid
      const errorMessage =
        err.response?.data?.current_password?.[0] ||
        err.response?.data?.message ||
        'Current password is incorrect';
      setErrors((prev) => ({ ...prev, old_password: errorMessage }));
      setIsCurrentPasswordValid(false);
    } finally {
      setIsValidatingPassword(false);
    }
  };

  const togglePasswordVisibility = (field: 'old' | 'new' | 'confirm') => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const validate = () => {
    const newErrors = {
      old_password: '',
      password: '',
      confirm_password: '',
      general: '',
    };

    if (!formData.old_password) {
      newErrors.old_password = 'Current password is required';
    }

    if (!formData.password) {
      newErrors.password = 'New password is required';
    } else if (formData.password.length < 4) {
      newErrors.password = 'Password must be at least 4 characters';
    }

    if (!formData.confirm_password) {
      newErrors.confirm_password = 'Please confirm your new password';
    } else if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }

    if (formData.old_password && formData.password && formData.old_password === formData.password) {
      newErrors.password = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error !== '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      await authApi.changePassword(formData);
      
      // Show success message
      toastSuccess('Password changed successfully! Redirecting to login...');
      
      // Wait 2 seconds before logout and redirect
      setTimeout(() => {
        logout();
      }, 2000);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.old_password?.[0] ||
        err.response?.data?.password?.[0] ||
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to change password';
      setErrors((prev) => ({ ...prev, general: errorMessage }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        old_password: '',
        password: '',
        confirm_password: '',
      });
      setErrors({
        old_password: '',
        password: '',
        confirm_password: '',
        general: '',
      });
      setIsCurrentPasswordValid(false);
      onClose();
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={(_event, reason) => {
          if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
            return;
          }
          handleClose();
        }}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 3,
            pt: 2.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LockIcon color="primary" />
            <span>Change Password</span>
          </Box>
          <IconButton onClick={handleClose} size="small" disabled={isLoading}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 4, pb: 3 }}>
          {errors.general && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {errors.general}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                  Current Password <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <TextField
                  name="old_password"
                  type={showPasswords.old ? 'text' : 'password'}
                  value={formData.old_password}
                  onChange={handleChange}
                  onBlur={validateCurrentPassword}
                  error={!!errors.old_password}
                  helperText={
                    isValidatingPassword
                      ? 'Validating password...'
                      : errors.old_password || (isCurrentPasswordValid ? '✓ Password verified' : '')
                  }
                  disabled={isLoading || isValidatingPassword}
                  autoFocus
                  fullWidth
                  placeholder="Enter current password"
                  sx={{ '& .MuiInputBase-root': { height: 42, borderRadius: 1 } }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => togglePasswordVisibility('old')}
                          edge="end"
                          size="small"
                          disabled={isValidatingPassword}
                        >
                          {showPasswords.old ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                  New Password <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <TextField
                  name="password"
                  type={showPasswords.new ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  error={!!errors.password}
                  helperText={errors.password || 'Minimum 4 characters'}
                  disabled={isLoading || !isCurrentPasswordValid}
                  fullWidth
                  placeholder="Enter new password"
                  sx={{ '& .MuiInputBase-root': { height: 42, borderRadius: 1 } }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => togglePasswordVisibility('new')}
                          edge="end"
                          size="small"
                        >
                          {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                  Confirm New Password <Box component="span" sx={{ color: '#f44336', fontWeight: 600 }}>*</Box>
                </Typography>
                <TextField
                  name="confirm_password"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={formData.confirm_password}
                  onChange={handleChange}
                  error={!!errors.confirm_password}
                  helperText={errors.confirm_password}
                  disabled={isLoading || !isCurrentPasswordValid}
                  fullWidth
                  placeholder="Re-enter new password"
                  sx={{ '& .MuiInputBase-root': { height: 42, borderRadius: 1 } }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => togglePasswordVisibility('confirm')}
                          edge="end"
                          size="small"
                        >
                          {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
          <Button onClick={handleClose} variant="outlined" disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            loading={isLoading}
            sx={{ minWidth: 120 }}
          >
            Change Password
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ChangePasswordDialog;
