import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import apiClient from '../../api/axios.config';
import { ROUTES } from '../../utils/constants';

const steps = ['Enter Username', 'Verify OTP', 'Set New Password'];

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 1: Request OTP
  const handleRequestOTP = async () => {
    if (!username.trim()) {
      setError('Please enter your username or email');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.post('/api/users/forgot-password/', { username: username.trim() });
      setUserId(response.data.user_id);
      setActiveStep(1);
    } catch (err: any) {
      setError(err.response?.data?.error || 'User not found');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and set password
  const handleVerifyOTP = () => {
    if (!otp.trim() || otp.length !== 5) {
      setError('Please enter the 5-digit OTP');
      return;
    }
    setError('');
    setActiveStep(2);
  };

  // Step 3: Reset password
  const handleResetPassword = async () => {
    if (!password || password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.post('/api/users/reset-password-confirm/', {
        user_id: userId,
        otp: otp.trim(),
        password,
      });
      setSuccess(response.data.message || 'Password reset successfully!');
      setTimeout(() => navigate(ROUTES.LOGIN), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f5f5f5',
        p: 2,
      }}
    >
      <Paper sx={{ p: 4, maxWidth: 450, width: '100%' }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
          Reset Password
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {!success && (
          <>
            {/* Step 1: Username */}
            {activeStep === 0 && (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Enter your username or email. We'll send an OTP to your registered email.
                </Typography>
                <TextField
                  fullWidth
                  label="Username or Email"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(''); }}
                  disabled={loading}
                  autoFocus
                  sx={{ mb: 3 }}
                  onKeyDown={(e) => e.key === 'Enter' && handleRequestOTP()}
                />
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleRequestOTP}
                  disabled={loading}
                  sx={{ mb: 2 }}
                >
                  {loading ? <CircularProgress size={20} /> : 'Send OTP'}
                </Button>
              </>
            )}

            {/* Step 2: Enter OTP */}
            {activeStep === 1 && (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  We've sent a 5-digit OTP to your registered email. Enter it below.
                </Typography>
                <TextField
                  fullWidth
                  label="Enter OTP"
                  value={otp}
                  onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 5)); setError(''); }}
                  disabled={loading}
                  autoFocus
                  inputProps={{ maxLength: 5, style: { letterSpacing: 8, fontSize: 20, textAlign: 'center' } }}
                  sx={{ mb: 3 }}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyOTP()}
                />
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.length !== 5}
                  sx={{ mb: 2 }}
                >
                  Verify OTP
                </Button>
              </>
            )}

            {/* Step 3: New Password */}
            {activeStep === 2 && (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Enter your new password.
                </Typography>
                <TextField
                  fullWidth
                  type="password"
                  label="New Password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  disabled={loading}
                  autoFocus
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  type="password"
                  label="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                  disabled={loading}
                  sx={{ mb: 3 }}
                  onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()}
                />
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleResetPassword}
                  disabled={loading}
                  sx={{ mb: 2 }}
                >
                  {loading ? <CircularProgress size={20} /> : 'Reset Password'}
                </Button>
              </>
            )}

            <Button
              fullWidth
              variant="text"
              startIcon={<BackIcon />}
              onClick={() => navigate(ROUTES.LOGIN)}
            >
              Back to Login
            </Button>
          </>
        )}

        {success && (
          <Button fullWidth variant="contained" onClick={() => navigate(ROUTES.LOGIN)}>
            Go to Login
          </Button>
        )}
      </Paper>
    </Box>
  );
};

export default ForgotPassword;
