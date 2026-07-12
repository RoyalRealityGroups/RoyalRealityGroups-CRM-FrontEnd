import React, { useState } from 'react';
import {
  Box,
  Typography,
  Alert,
  Paper,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Button, TextField } from '../common';
import { authApi } from '../../api/auth.api';
import { ROUTES } from '../../utils/constants';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirm_password: '',
  });

  const [validationErrors, setValidationErrors] = useState({
    username: '',
    password: '',
    confirm_password: '',
  });

  const steps = ['Enter Username', 'Set New Password'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    setError('');
  };

  const validateUsername = () => {
    if (!formData.username.trim()) {
      setValidationErrors((prev) => ({ ...prev, username: 'Username is required' }));
      return false;
    }
    return true;
  };

  const validatePasswords = () => {
    const errors = {
      username: '',
      password: '',
      confirm_password: '',
    };

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 4) {
      errors.password = 'Password must be at least 4 characters';
    }

    if (!formData.confirm_password) {
      errors.confirm_password = 'Confirm password is required';
    } else if (formData.password !== formData.confirm_password) {
      errors.confirm_password = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return !errors.password && !errors.confirm_password;
  };

  const handleNext = async () => {
    if (activeStep === 0) {
      if (!validateUsername()) return;

      setLoading(true);
      setError('');
      
      try {
        // Validate username with backend
        await authApi.validateUsername(formData.username);
        setActiveStep(1);
      } catch (err: any) {
        const errorMessage = err.response?.data?.username?.[0] || 
                            err.response?.data?.error || 
                            'Username not found';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    } else if (activeStep === 1) {
      if (!validatePasswords()) return;

      setLoading(true);
      setError('');

      try {
        await authApi.forgotPassword(formData);
        setSuccess('Password updated successfully! Redirecting to login...');
        setTimeout(() => {
          navigate(ROUTES.LOGIN);
        }, 2000);
      } catch (err: any) {
        const errorMessage = err.response?.data?.username?.[0] || 
                            err.response?.data?.error || 
                            err.response?.data?.message ||
                            'Failed to reset password';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    setError('');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        padding: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          maxWidth: 500,
          width: '100%',
          padding: 4,
        }}
      >
        <Typography variant="h5" fontWeight={600} gutterBottom align="center">
          Reset Password
        </Typography>
        <Typography variant="body2" color="textSecondary" align="center" sx={{ mb: 3 }}>
          Enter your details to reset your password
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box component="form">
          {activeStep === 0 && (
            <TextField
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              error={!!validationErrors.username}
              helperText={validationErrors.username}
              required
              autoFocus
              sx={{ mb: 3 }}
            />
          )}

          {activeStep === 1 && (
            <>
              <TextField
                label="New Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                error={!!validationErrors.password}
                helperText={validationErrors.password}
                required
                autoFocus
                sx={{ mb: 2 }}
              />
              <TextField
                label="Confirm Password"
                name="confirm_password"
                type="password"
                value={formData.confirm_password}
                onChange={handleChange}
                error={!!validationErrors.confirm_password}
                helperText={validationErrors.confirm_password}
                required
                sx={{ mb: 3 }}
              />
            </>
          )}

          <Box sx={{ display: 'flex', gap: 2 }}>
            {activeStep > 0 && (
              <Button
                variant="outlined"
                onClick={handleBack}
                disabled={loading}
                fullWidth
              >
                Back
              </Button>
            )}
            <Button
              variant="contained"
              onClick={handleNext}
              loading={loading}
              fullWidth
            >
              {activeStep === steps.length - 1 ? 'Reset Password' : 'Next'}
            </Button>
          </Box>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button
              variant="text"
              onClick={() => navigate(ROUTES.LOGIN)}
              disabled={loading}
            >
              Back to Login
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default ForgotPassword;
