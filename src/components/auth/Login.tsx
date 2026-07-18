import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  Link,
  Alert,
  InputAdornment,
  IconButton,
  Paper,
  Fade,
} from '@mui/material';
import { Visibility, VisibilityOff, PersonOutline, LockOutlined, ShieldOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Button, TextField } from '../common';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../utils/constants';
import { storage } from '../../utils/storage';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    remember_me: false,
  });

  const [validationErrors, setValidationErrors] = useState({
    username: '',
    password: '',
  });
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const toErrorText = (value: unknown): string => {
    if (Array.isArray(value)) return String(value[0] ?? '');
    return String(value ?? '');
  };

  const getFriendlyFieldError = (field: 'username' | 'password', rawValue: unknown): string => {
    const message = toErrorText(rawValue).trim();
    const normalized = message.toLowerCase();
    if (field === 'username') {
      if (normalized.includes('required') || normalized.includes('blank'))
        return 'Please enter your username.';
      if (normalized.includes('not found')) return 'No account found with this username.';
    }
    if (field === 'password') {
      if (normalized.includes('required') || normalized.includes('blank'))
        return 'Please enter your password.';
      if (normalized.includes('incorrect')) return 'The password you entered is incorrect.';
    }
    return message;
  };

  const getFriendlyGeneralError = (err: any): string => {
    if (!err?.response)
      return 'Unable to connect to the server. Please check your internet connection.';
    const data = err.response?.data || {};
    const rawMessage = data?.detail || data?.message || data?.error || '';
    const message = String(rawMessage).trim();
    const normalized = message.toLowerCase();
    if (normalized.includes('inactive'))
      return 'Your account is inactive. Please contact your administrator.';
    if (normalized.includes('device not allowed'))
      return 'This device is not allowed for login. Please contact your administrator.';
    return message || 'Login failed. Please verify your credentials and try again.';
  };

  const extractLoginErrors = (backendData: any) => {
    const source =
      backendData?.errors && typeof backendData.errors === 'object' ? backendData.errors : backendData;
    return { username: source?.username, password: source?.password };
  };

  useEffect(() => {
    const saved = storage.getSavedCredentials();
    if (saved) {
      setFormData((prev) => ({
        ...prev,
        username: saved.username,
        password: saved.password,
        remember_me: true,
      }));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (formError) setFormError('');
    if (validationErrors[name as keyof typeof validationErrors]) {
      setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errors = { username: '', password: '' };
    if (!formData.username.trim()) errors.username = 'Please enter your username.';
    if (!formData.password) errors.password = 'Please enter your password.';
    else if (!formData.password.trim()) errors.password = 'Password cannot be empty spaces.';
    setValidationErrors(errors);
    return !errors.username && !errors.password;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;
    try {
      const payload = { ...formData, username: formData.username.trim() };
      if (payload.remember_me) storage.setSavedCredentials(payload.username, payload.password);
      else storage.clearSavedCredentials();
      await login(payload);
    } catch (err: any) {
      if (err.response?.data) {
        const extracted = extractLoginErrors(err.response.data);
        const nextErrors = {
          username: extracted.username ? getFriendlyFieldError('username', extracted.username) : '',
          password: extracted.password ? getFriendlyFieldError('password', extracted.password) : '',
        };
        setValidationErrors(nextErrors);
        if (!nextErrors.username && !nextErrors.password) setFormError(getFriendlyGeneralError(err));
      } else {
        setFormError(getFriendlyGeneralError(err));
      }
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        backgroundColor: '#F8FAFC',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Brand Left Panel with dynamic mesh styling */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: 6.5,
          color: '#FFFFFF',
          flexDirection: 'column',
          justifyContent: 'space-between',
          px: 8,
          py: 6,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div className="mesh-background" />
        <div className="mesh-glow-1" />
        <div className="mesh-glow-2" />

        {/* Branding */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, zIndex: 1 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              border: '2px solid rgba(16, 185, 129, 0.4)',
              backgroundColor: '#001218',
            }}
          >
            <Box
              component="img"
              src="/logo.jpeg"
              alt="Royal Reality Groups"
              sx={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 38%', display: 'block' }}
            />
          </Box>
          <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '0.02em', color: '#10B981', fontFamily: '"Outfit", sans-serif' }}>
            ROYAL REALITY GROUPS
          </Typography>
        </Box>

        {/* Product Callout */}
        <Box sx={{ maxWidth: 520, zIndex: 1 }}>
          <Typography sx={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.02em', fontFamily: '"Outfit", sans-serif' }}>
            Elevate Real Estate Operations with Luxury Frameworks.
          </Typography>
          <Typography sx={{ mt: 3, fontSize: '1rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, fontWeight: 400 }}>
            Unified real estate pipelines, site visit feedback controls, automated invoice distributions, and interactive reports modules. Designed for modern builders.
          </Typography>
        </Box>

        {/* Footer brand stamp */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, zIndex: 1, color: 'rgba(255,255,255,0.4)' }}>
          <ShieldOutlined sx={{ fontSize: 16 }} />
          <Typography sx={{ fontSize: '0.75rem', letterSpacing: '0.02em' }}>
            © {new Date().getFullYear()} Royal Reality Groups CRM. Enterprise Core.
          </Typography>
        </Box>
      </Box>

      {/* Right Login Form Panel (Consistent Clean Light Layout) */}
      <Box
        sx={{
          flex: { xs: 1, md: 5.5 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 3, sm: 6, md: 8 },
          py: 6,
          zIndex: 1,
          backgroundColor: '#F8FAFC',
          borderLeft: { md: '1px solid rgba(79, 70, 229, 0.08)' },
        }}
      >
        <Fade in timeout={800}>
          <Paper
            elevation={0}
            sx={{
              width: '100%',
              maxWidth: 420,
              p: { xs: 4, md: 5 },
              borderRadius: '16px',
              border: '1px solid rgba(79, 70, 229, 0.08)',
              boxShadow: '0 12px 32px rgba(79, 70, 229, 0.04)',
              backgroundColor: '#FFFFFF',
            }}
          >
            {/* Logo header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1,
                  overflow: 'hidden',
                  backgroundColor: '#001218',
                }}
              >
                <Box
                  component="img"
                  src="/logo.jpeg"
                  alt="Royal Reality Groups"
                  sx={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 38%', display: 'block' }}
                />
              </Box>
              <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#10B981', fontFamily: '"Outfit", sans-serif' }}>
                ROYAL REALITY GROUPS
              </Typography>
            </Box>

            <Typography variant="h4" sx={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.01em', color: '#0F172A' }}>
              Sign in to CRM
            </Typography>
            <Typography sx={{ mt: 1, mb: 4, fontSize: '0.875rem', color: 'text.secondary' }}>
              Authorized accounts only. Enter credentials.
            </Typography>

            {(formError || error) && !validationErrors.username && !validationErrors.password && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {formError || error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Box sx={{ mb: 2.5 }}>
                <TextField
                  name="username"
                  label="Username"
                  value={formData.username}
                  onChange={handleChange}
                  error={!!validationErrors.username}
                  helperText={validationErrors.username}
                  required
                  fullWidth
                  autoFocus
                  disabled={isLoading}
                  placeholder="Enter username"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutline fontSize="small" sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiInputBase-root': {
                      backgroundColor: '#FFFFFF',
                    },
                  }}
                />
              </Box>

              <Box sx={{ mb: 2.5 }}>
                <TextField
                  name="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  error={!!validationErrors.password}
                  helperText={validationErrors.password}
                  required
                  fullWidth
                  disabled={isLoading}
                  placeholder="Enter password"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlined fontSize="small" sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          disabled={isLoading}
                          size="small"
                        >
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiInputBase-root': {
                      backgroundColor: '#FFFFFF',
                    },
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4.5 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.remember_me}
                      onChange={handleChange}
                      name="remember_me"
                      disabled={isLoading}
                      size="small"
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
                      Remember me
                    </Typography>
                  }
                />
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
                  disabled={isLoading}
                  sx={{ fontSize: '0.8125rem', color: '#4F46E5', fontWeight: 600, '&:hover': { color: '#4338CA' } }}
                >
                  Forgot password?
                </Link>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading}
                sx={{
                  py: 1.2,
                  fontSize: '0.9375rem',
                  backgroundColor: '#4F46E5',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)',
                  '&:hover': {
                    backgroundColor: '#4338CA',
                    boxShadow: '0 8px 24px rgba(79, 70, 229, 0.3)',
                  },
                }}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </Box>
          </Paper>
        </Fade>
      </Box>
    </Box>
  );
};

export default Login;
