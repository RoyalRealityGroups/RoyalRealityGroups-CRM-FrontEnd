import React, { useEffect, useMemo } from 'react';
import {
  AppBar as MuiAppBar,
  Badge,
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
  Slide,
} from '@mui/material';
import {
  AccountCircle,
  Logout as LogoutIcon,
  Lock as LockIcon,
  Menu as MenuIcon,
  NotificationsOutlined,
  SettingsOutlined as SettingsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../api/auth.api';
import { notificationApi } from '../../api/notification.api';
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
  const [notifAnchorEl, setNotifAnchorEl] = React.useState<null | HTMLElement>(null);
  const [showChangePassword, setShowChangePassword] = React.useState(false);

  const queryClient = useQueryClient();

  // Sync latest user data once on mount (fire-and-forget, no polling)
  useEffect(() => {
    authApi.getCurrentUser()
      .then((userData) => { dispatch(setUser({ ...user, ...userData })); })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run once — user object from Redux is the source of truth

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.getNotifications(),
    // No refetchInterval — polling every 30 s was triggering token-refresh
    // failures which caused full-page reloads via window.location.href.
    // Notifications are refreshed on demand (mark-all-read invalidates the query).
    staleTime: 5 * 60 * 1000, // treat as fresh for 5 minutes
  });

  const unreadCount = useMemo(() => notifications.length, [notifications]);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleNotifOpen = (event: React.MouseEvent<HTMLElement>) => setNotifAnchorEl(event.currentTarget);
  const handleNotifClose = () => setNotifAnchorEl(null);
  const handleMarkAllRead = () => {
    notificationApi.markAllAsRead();
    queryClient.setQueryData(['notifications'], []);
    handleNotifClose();
  };
  const handleChangePassword = () => { handleClose(); setShowChangePassword(true); };
  const handleLogout = () => { handleClose(); logout(); };

  const userInitials =
    ((user?.first_name?.[0] || '') + (user?.last_name?.[0] || '')).toUpperCase() ||
    (user?.username?.[0] || 'U').toUpperCase();

  return (
    <MuiAppBar position="fixed">
      <Toolbar sx={{ minHeight: { xs: '60px !important', sm: '68px !important' }, gap: 1 }}>
        <IconButton
          color="default"
          edge="start"
          onClick={onMenuClick}
          aria-label="open navigation"
          sx={{ color: 'text.secondary' }}
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
              color: 'text.primary',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {isMobile ? 'Royal Reality' : 'Royal Reality Groups'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
          <Tooltip title="Notifications">
            <IconButton
              onClick={handleNotifOpen}
              sx={{
                p: 1,
                color: 'text.secondary',
                '&:hover': { backgroundColor: 'rgba(79, 70, 229, 0.04)' },
              }}
            >
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsOutlined sx={{ fontSize: 20 }} />
              </Badge>
            </IconButton>
          </Tooltip>
          <Box sx={{ width: 1, height: 24, backgroundColor: 'rgba(15, 23, 42, 0.08)' }} />
          <Tooltip title="Account menu">
            <IconButton onClick={handleMenu} sx={{ p: 0.5 }} aria-label="account menu">
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  backgroundColor: 'primary.main',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                }}
              >
                {userInitials}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>

        <Menu
          anchorEl={notifAnchorEl}
          open={Boolean(notifAnchorEl)}
          onClose={handleNotifClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          TransitionComponent={Slide}
          transitionDuration={{ enter: 220, exit: 160 }}
          slotProps={{ paper: { sx: { minWidth: 320, maxHeight: 400, mt: 0.5 } } }}
        >
          <Box sx={{ px: 2, py: 1.25, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2" fontWeight={600}>Notifications</Typography>
            <Typography variant="caption" color="primary" sx={{ cursor: 'pointer' }} onClick={handleMarkAllRead}>Mark all read</Typography>
          </Box>
          <Divider />
          {notifications.length === 0 ? (
            <MenuItem disabled sx={{ justifyContent: 'center', py: 3 }}>
              <Typography variant="body2" color="text.secondary">No notifications</Typography>
            </MenuItem>
          ) : notifications.slice(0, 10).map((n) => (
            <MenuItem key={n.id} onClick={() => { notificationApi.markAsRead(String(n.id)); handleNotifClose(); }} sx={{ whiteSpace: 'normal', py: 1.5 }}>
              <ListItemIcon sx={{ minWidth: 36, mt: 0.25, alignSelf: 'flex-start' }}>
                <NotificationsOutlined fontSize="small" color="primary" />
              </ListItemIcon>
              <Box>
                <Typography variant="body2" fontWeight={500}>{n.subject}</Typography>
                <Typography variant="caption" color="text.secondary" display="block">{n.body}</Typography>
                <Typography variant="caption" color="text.disabled">{n.created_on}</Typography>
              </Box>
            </MenuItem>
          ))}
        </Menu>

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
              navigate('/profile');
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
          {user?.is_superuser && (
            <MenuItem
              onClick={() => {
                handleClose();
                navigate('/settings');
              }}
            >
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              Settings
            </MenuItem>
          )}
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
