import React, { useEffect } from 'react';
import {
  AppBar as MuiAppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  useMediaQuery,
  useTheme,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  AccountCircle,
  Logout as LogoutIcon,
  Lock as LockIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../api/auth.api';
import { setUser } from '../../store/slices/authSlice';
import { useAppDispatch } from '../../store/hooks';
import ChangePasswordDialog from '../auth/ChangePasswordDialog';

interface AppBarProps {
  onMenuClick: () => void;
}

const AppBar: React.FC<AppBarProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [showChangePassword, setShowChangePassword] = React.useState(false);

  useEffect(() => {
    authApi.getCurrentUser().then((userData) => {
      dispatch(setUser({ ...user, ...userData }));
    }).catch(() => {});
  }, []);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleChangePassword = () => { handleClose(); setShowChangePassword(true); };
  const handleLogout = () => { handleClose(); logout(); };

  const userInitials =
    ((user?.first_name?.[0] || '') + (user?.last_name?.[0] || '')).toUpperCase() ||
    (user?.username?.[0] || 'U').toUpperCase();

  return (
    <MuiAppBar position="fixed">
      <Toolbar sx={{ minHeight: { xs: '60px !important', sm: '68px !important' }, gap: 1 }}>
        <IconButton
          color="inherit"
          edge="start"
          onClick={onMenuClick}
          aria-label="open navigation"
        >
          <MenuIcon />
        </IconButton>

        <Box
          onClick={() => navigate('/dashboard')}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            cursor: 'pointer',
            flexGrow: 1,
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              width: { xs: 32, sm: 36 },
              height: { xs: 32, sm: 36 },
              borderRadius: 1,
              overflow: 'hidden',
              flexShrink: 0,
              backgroundColor: '#001218',
            }}
          >
            <Box
              component="img"
              src="/logo.jpeg"
              alt="Royal Reality Groups"
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center 38%',
                display: 'block',
              }}
            />
          </Box>
          <Typography
            component="div"
            sx={{
              fontWeight: 600,
              fontSize: { xs: '0.9375rem', sm: '1rem' },
              color: '#FFFFFF',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {isMobile ? 'Royal Reality' : 'Royal Reality Groups'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1.5 } }}>
          {!isMobile && (
            <Typography
              sx={{ fontSize: '0.8125rem', fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}
            >
              {user?.first_name || user?.username}
            </Typography>
          )}
          <Tooltip title="Account menu">
            <IconButton onClick={handleMenu} sx={{ p: 0.5 }} aria-label="account menu">
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  backgroundColor: 'rgba(255,255,255,0.16)',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                }}
              >
                {userInitials}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{
            paper: { sx: { minWidth: 220, mt: 0.5 } },
          }}
        >
          <Box sx={{ px: 2, py: 1.25 }}>
            <Typography variant="body2" fontWeight={600}>
              {user?.first_name} {user?.last_name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.email}
            </Typography>
          </Box>
          <Divider />
          <MenuItem
            onClick={() => {
              handleClose();
              navigate(`/settings/users/view/${user?.id}?profile=true`);
            }}
          >
            <ListItemIcon>
              <AccountCircle fontSize="small" />
            </ListItemIcon>
            Manage Profile
          </MenuItem>
          <MenuItem onClick={handleChangePassword}>
            <ListItemIcon>
              <LockIcon fontSize="small" />
            </ListItemIcon>
            Change Password
          </MenuItem>
          <Divider sx={{ my: 0.5 }} />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            Logout
          </MenuItem>
        </Menu>

        <ChangePasswordDialog
          open={showChangePassword}
          onClose={() => setShowChangePassword(false)}
        />
      </Toolbar>
    </MuiAppBar>
  );
};

export default AppBar;
