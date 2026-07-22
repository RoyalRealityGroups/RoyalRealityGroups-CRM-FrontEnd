import React, { useEffect, useMemo, useCallback } from 'react';
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
  Chip,
  Tab,
  Tabs,
} from '@mui/material';
import {
  AccountCircle,
  Logout as LogoutIcon,
  Lock as LockIcon,
  Menu as MenuIcon,
  NotificationsOutlined,
  SettingsOutlined as SettingsIcon,
  AccessTime as AccessTimeIcon,
  Phone as PhoneIcon,
  WhatsApp as WhatsAppIcon,
  Groups as MeetingIcon,
  LocationOn as SiteVisitIcon,
  ErrorOutline as OverdueIcon,
  EventAvailable as UpcomingIcon,
  CheckCircleOutline as DoneIcon,
  DoneAll as DoneAllIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../api/auth.api';
import { leadApi } from '../../api/lead.api';
import { setUser } from '../../store/slices/authSlice';
import { useAppDispatch } from '../../store/hooks';
import ChangePasswordDialog from '../auth/ChangePasswordDialog';
import type { LeadFollowUp } from '../../types/lead.types';

interface AppBarProps {
  onMenuClick: () => void;
}

// ── helpers ────────────────────────────────────────────────────────────────

const FOLLOW_UP_TYPE_ICON: Record<string, React.ReactElement> = {
  CALL: <PhoneIcon sx={{ fontSize: 14 }} />,
  WHATSAPP: <WhatsAppIcon sx={{ fontSize: 14 }} />,
  MEETING: <MeetingIcon sx={{ fontSize: 14 }} />,
  SITE_VISIT: <SiteVisitIcon sx={{ fontSize: 14 }} />,
};

const FOLLOW_UP_TYPE_COLOR: Record<string, string> = {
  CALL: '#1976d2',
  WHATSAPP: '#25d366',
  MEETING: '#7b1fa2',
  SITE_VISIT: '#f57c00',
};

function formatFollowUpTime(time?: string | null): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function formatSectionDate(dateStr: string, serverNow: Date): string {
  const today = new Date(serverNow);
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - d.getTime()) / 86400000);
  const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  if (diffDays === 0) return `Today · ${label}`;
  if (diffDays === 1) return `Yesterday · ${label}`;
  return `${diffDays} days ago · ${label}`;
}

/**
 * Classify a follow-up as "upcoming" or "missed" based on server time.
 *
 * Rules:
 *  - date < today                          → MISSED  (overdue day)
 *  - date = today, time set, time > now    → UPCOMING
 *  - date = today, time set, time <= now   → MISSED
 *  - date = today, no time set             → UPCOMING (show as "Today, no time")
 */
function classify(r: LeadFollowUp, serverNow: Date): 'upcoming' | 'missed' {
  const todayStr = serverNow.toISOString().slice(0, 10);
  const dateKey = r.next_follow_up_date ?? r.follow_up_date;

  if (dateKey < todayStr) return 'missed';

  // dateKey === todayStr
  if (!r.follow_up_time) return 'upcoming'; // no time → still upcoming

  // Compare HH:MM against current time
  const [fh, fm] = r.follow_up_time.split(':').map(Number);
  const followMinutes = fh * 60 + fm;
  const nowMinutes = serverNow.getHours() * 60 + serverNow.getMinutes();
  return followMinutes > nowMinutes ? 'upcoming' : 'missed';
}

// ── reusable reminder row ──────────────────────────────────────────────────

interface ReminderRowProps {
  r: LeadFollowUp;
  bucket: 'upcoming' | 'missed';
  onOpen: (leadId: string) => void;
  onDismiss: (e: React.MouseEvent, id: string) => void;
}

const ReminderRow: React.FC<ReminderRowProps> = ({ r, bucket, onOpen, onDismiss }) => {
  const typeColor = FOLLOW_UP_TYPE_COLOR[r.follow_up_type] ?? '#666';
  const typeIcon = FOLLOW_UP_TYPE_ICON[r.follow_up_type];
  const timeStr = formatFollowUpTime(r.follow_up_time);
  const missed = bucket === 'missed';

  return (
    <MenuItem
      onClick={() => onOpen(r.lead.id)}
      sx={{
        py: 1.25,
        px: 2,
        alignItems: 'flex-start',
        gap: 1.25,
        borderLeft: 3,
        borderColor: missed ? 'error.light' : 'transparent',
        '&:hover': { backgroundColor: missed ? 'rgba(211,47,47,0.04)' : 'rgba(25,118,210,0.04)' },
        '&:hover .mark-read-btn': { opacity: 1 },
        borderBottom: '1px solid',
        borderBottomColor: 'divider',
      }}
    >
      {/* Type icon bubble */}
      <Box sx={{
        width: 32, height: 32, borderRadius: '50%',
        backgroundColor: typeColor + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, mt: 0.25, color: typeColor,
      }}>
        {typeIcon}
      </Box>

      {/* Content */}
      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
          <Typography variant="caption" fontWeight={700} sx={{
            color: 'primary.main', fontFamily: 'monospace', fontSize: '0.7rem',
            backgroundColor: 'rgba(25,118,210,0.08)', px: 0.75, py: 0.1,
            borderRadius: 0.5, letterSpacing: 0.3,
          }}>
            {r.lead.code}
          </Typography>
          <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 180 }}>
            {r.lead.name}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.3 }}>
          <Chip label={r.follow_up_type} size="small" sx={{
            height: 16, fontSize: '0.6rem', fontWeight: 600,
            backgroundColor: typeColor + '18', color: typeColor,
            '& .MuiChip-label': { px: 0.75 },
          }} />
          {timeStr ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
              <AccessTimeIcon sx={{ fontSize: 11, color: missed ? 'error.main' : 'text.secondary' }} />
              <Typography variant="caption" fontWeight={600}
                color={missed ? 'error.main' : 'text.secondary'}>
                {timeStr}
              </Typography>
            </Box>
          ) : (
            <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
              no time set
            </Typography>
          )}
        </Box>

        {r.discussion_notes && (
          <Typography variant="caption" color="text.secondary" sx={{
            display: 'block', mt: 0.3, overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240,
          }}>
            {r.discussion_notes}
          </Typography>
        )}
      </Box>

      {/* Right — dismiss button */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
        <Tooltip title="Mark as read">
          <IconButton
            className="mark-read-btn"
            size="small"
            onClick={(e) => onDismiss(e, String(r.id))}
            sx={{
              opacity: 0, transition: 'opacity 0.15s', p: 0.3,
              color: 'text.disabled',
              '&:hover': { color: 'success.main', backgroundColor: 'rgba(46,125,50,0.08)' },
            }}
          >
            <DoneIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </MenuItem>
  );
};

// ── grouped section within a tab ───────────────────────────────────────────

interface BucketListProps {
  items: LeadFollowUp[];
  bucket: 'upcoming' | 'missed';
  serverNow: Date;
  onOpen: (leadId: string) => void;
  onDismiss: (e: React.MouseEvent, id: string) => void;
}

const BucketList: React.FC<BucketListProps> = ({ items, bucket, serverNow, onOpen, onDismiss }) => {
  if (items.length === 0) {
    return (
      <Box sx={{ py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75 }}>
        {bucket === 'upcoming'
          ? <ScheduleIcon sx={{ fontSize: 32, color: 'text.disabled' }} />
          : <OverdueIcon sx={{ fontSize: 32, color: 'text.disabled' }} />
        }
        <Typography variant="body2" color="text.secondary">
          {bucket === 'upcoming' ? 'No upcoming follow-ups' : 'No missed follow-ups'}
        </Typography>
        <Typography variant="caption" color="text.disabled">
          {bucket === 'upcoming' ? "You're all set for today!" : 'Great job staying on top of things!'}
        </Typography>
      </Box>
    );
  }

  // Group by date key
  const grouped = new Map<string, LeadFollowUp[]>();
  for (const r of items) {
    const key = r.next_follow_up_date ?? r.follow_up_date;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(r);
  }

  return (
    <>
      {Array.from(grouped.entries()).map(([dateKey, rows]) => {
        const sectionLabel = formatSectionDate(dateKey, serverNow);
        const isMissed = bucket === 'missed';
        return (
          <Box key={dateKey}>
            <Box sx={{
              px: 2, py: 0.6,
              display: 'flex', alignItems: 'center', gap: 0.75,
              backgroundColor: isMissed ? 'rgba(211,47,47,0.06)' : 'rgba(25,118,210,0.06)',
              borderLeft: 3,
              borderColor: isMissed ? 'error.main' : 'primary.main',
            }}>
              {isMissed
                ? <OverdueIcon sx={{ fontSize: 12, color: 'error.main' }} />
                : <UpcomingIcon sx={{ fontSize: 12, color: 'primary.main' }} />
              }
              <Typography variant="caption" fontWeight={700}
                color={isMissed ? 'error.main' : 'primary.main'}
                sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem' }}>
                {sectionLabel}
              </Typography>
              <Chip label={rows.length} size="small" sx={{
                height: 14, fontSize: '0.6rem', fontWeight: 700, ml: 'auto',
                backgroundColor: isMissed ? 'rgba(211,47,47,0.15)' : 'rgba(25,118,210,0.15)',
                color: isMissed ? 'error.dark' : 'primary.dark',
                '& .MuiChip-label': { px: 0.5 },
              }} />
            </Box>
            {rows.map((r) => (
              <ReminderRow key={r.id} r={r} bucket={bucket} onOpen={onOpen} onDismiss={onDismiss} />
            ))}
          </Box>
        );
      })}
    </>
  );
};

// ── main component ─────────────────────────────────────────────────────────

const AppBar: React.FC<AppBarProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [notifAnchorEl, setNotifAnchorEl] = React.useState<null | HTMLElement>(null);
  const [showChangePassword, setShowChangePassword] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<0 | 1>(0); // 0=Upcoming, 1=Missed

  // Dismissed IDs in sessionStorage — survive re-renders & polls, reset on tab close
  const [dismissedIds, setDismissedIds] = React.useState<Set<string>>(() => {
    try {
      const stored = sessionStorage.getItem('reminder_dismissed');
      return stored ? new Set(JSON.parse(stored)) : new Set<string>();
    } catch { return new Set<string>(); }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('reminder_dismissed', JSON.stringify([...dismissedIds]));
    } catch { /* ignore */ }
  }, [dismissedIds]);

  // Sync user data once on mount
  useEffect(() => {
    authApi.getCurrentUser()
      .then((userData) => { dispatch(setUser({ ...user, ...userData })); })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll follow-up reminders every 5 minutes
  const { data: remindersData } = useQuery({
    queryKey: ['followup-reminders'],
    queryFn: () => leadApi.getFollowUpReminders(),
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });

  const allReminders: LeadFollowUp[] = remindersData?.results ?? [];
  // Parse server time; fall back to client time if missing
  const serverNow = useMemo(() => {
    return remindersData?.server_now ? new Date(remindersData.server_now) : new Date();
  }, [remindersData?.server_now]);

  // Prune stale dismissed IDs
  useEffect(() => {
    if (allReminders.length === 0) return;
    const activeIds = new Set(allReminders.map((r) => String(r.id)));
    setDismissedIds((prev) => {
      const pruned = new Set([...prev].filter((id) => activeIds.has(id)));
      return pruned.size !== prev.size ? pruned : prev;
    });
  }, [allReminders.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Active (non-dismissed) reminders, split into upcoming/missed
  const { upcoming, missed } = useMemo(() => {
    const active = allReminders.filter((r) => !dismissedIds.has(String(r.id)));
    const upcoming: LeadFollowUp[] = [];
    const missed: LeadFollowUp[] = [];
    for (const r of active) {
      classify(r, serverNow) === 'upcoming' ? upcoming.push(r) : missed.push(r);
    }
    return { upcoming, missed };
  }, [allReminders, dismissedIds, serverNow]);

  const upcomingCount = upcoming.length;
  const missedCount = missed.length;
  const totalCount = upcomingCount + missedCount;

  // Auto-switch to Missed tab if there are missed items and none upcoming
  useEffect(() => {
    if (missedCount > 0 && upcomingCount === 0) setActiveTab(1);
    else setActiveTab(0);
  }, [missedCount, upcomingCount]);

  const handleMarkOneRead = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDismissedIds((prev) => new Set([...prev, id]));
  }, []);

  const handleMarkAllRead = useCallback(() => {
    setDismissedIds(new Set(allReminders.map((r) => String(r.id))));
  }, [allReminders]);

  const handleMenu = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleNotifOpen = (e: React.MouseEvent<HTMLElement>) => setNotifAnchorEl(e.currentTarget);
  const handleNotifClose = () => setNotifAnchorEl(null);
  const handleChangePassword = () => { handleClose(); setShowChangePassword(true); };
  const handleLogout = () => { handleClose(); logout(); };
  const handleReminderClick = (leadId: string) => { handleNotifClose(); navigate(`/lead/view/${leadId}`); };

  const userInitials =
    ((user?.first_name?.[0] || '') + (user?.last_name?.[0] || '')).toUpperCase() ||
    (user?.username?.[0] || 'U').toUpperCase();

  const tooltipTitle = totalCount > 0
    ? `${upcomingCount} upcoming · ${missedCount} missed`
    : 'No reminders';

  return (
    <MuiAppBar position="fixed">
      <Toolbar sx={{ minHeight: { xs: '60px !important', sm: '68px !important' }, gap: 1 }}>
        <IconButton color="default" edge="start" onClick={onMenuClick}
          aria-label="open navigation" sx={{ color: 'text.secondary' }}>
          <MenuIcon />
        </IconButton>

        <Box onClick={() => navigate('/dashboard')}
          sx={{ display: 'flex', alignItems: 'center', gap: 1.25, cursor: 'pointer', flexGrow: 1, minWidth: 0 }}>
          <Box sx={{ width: { xs: 32, sm: 36 }, height: { xs: 32, sm: 36 }, borderRadius: 1,
            overflow: 'hidden', flexShrink: 0, backgroundColor: '#001218' }}>
            <Box component="img" src="/logo.jpeg" alt="Royal Reality Groups"
              sx={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 38%', display: 'block' }} />
          </Box>
          <Typography component="div" sx={{
            fontWeight: 600, fontSize: { xs: '0.9375rem', sm: '1rem' }, color: 'text.primary',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {isMobile ? 'Royal Reality' : 'Royal Reality Groups'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
          <Tooltip title={tooltipTitle}>
            <IconButton onClick={handleNotifOpen}
              sx={{ p: 1, color: 'text.secondary', '&:hover': { backgroundColor: 'rgba(79,70,229,0.04)' } }}>
              <Badge badgeContent={totalCount > 0 ? totalCount : null} color="error" max={99}>
                <NotificationsOutlined sx={{ fontSize: 20 }} />
              </Badge>
            </IconButton>
          </Tooltip>
          <Box sx={{ width: 1, height: 24, backgroundColor: 'rgba(15,23,42,0.08)' }} />
          <Tooltip title="Account menu">
            <IconButton onClick={handleMenu} sx={{ p: 0.5 }} aria-label="account menu">
              <Avatar src={user?.profilepicture || undefined}
                sx={{ width: 32, height: 32, backgroundColor: 'primary.main',
                  color: '#FFFFFF', fontWeight: 700, fontSize: '0.8125rem' }}>
                {userInitials}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>

        {/* ── Notification Panel ──────────────────────────────────────────── */}
        <Menu
          anchorEl={notifAnchorEl}
          open={Boolean(notifAnchorEl)}
          onClose={handleNotifClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          TransitionComponent={Slide}
          transitionDuration={{ enter: 220, exit: 160 }}
          slotProps={{
            paper: { sx: { width: 390, maxHeight: 560, mt: 0.5, overflow: 'hidden',
              display: 'flex', flexDirection: 'column' } },
          }}
        >
          {/* ── Panel header ── */}
          <Box sx={{ px: 2, pt: 1.5, pb: 0.5, display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', flexShrink: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" fontWeight={700}>Follow-up Reminders</Typography>
              {totalCount > 0 && (
                <Chip label={totalCount} size="small" color="error"
                  sx={{ height: 18, fontSize: '0.68rem', fontWeight: 700, minWidth: 22 }} />
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {totalCount > 0 && (
                <Tooltip title="Mark all as read">
                  <Box onClick={handleMarkAllRead} sx={{
                    display: 'flex', alignItems: 'center', gap: 0.4, cursor: 'pointer',
                    color: 'text.secondary', '&:hover': { color: 'success.main' },
                  }}>
                    <DoneAllIcon sx={{ fontSize: 15 }} />
                    <Typography variant="caption" fontWeight={500} sx={{ color: 'inherit' }}>
                      Mark all read
                    </Typography>
                  </Box>
                </Tooltip>
              )}
              <Typography variant="caption" color="primary.main"
                sx={{ cursor: 'pointer', fontWeight: 500 }}
                onClick={() => { handleNotifClose(); navigate('/lead/follow-ups'); }}>
                View all
              </Typography>
            </Box>
          </Box>

          {/* ── Tabs ── */}
          <Tabs
            value={activeTab}
            onChange={(_e, v) => setActiveTab(v)}
            variant="fullWidth"
            sx={{
              flexShrink: 0,
              minHeight: 36,
              '& .MuiTab-root': { minHeight: 36, fontSize: '0.75rem', fontWeight: 600, textTransform: 'none' },
              '& .MuiTabs-indicator': { height: 2 },
            }}
          >
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <UpcomingIcon sx={{ fontSize: 14 }} />
                  Upcoming
                  {upcomingCount > 0 && (
                    <Chip label={upcomingCount} size="small"
                      sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700,
                        backgroundColor: 'rgba(25,118,210,0.15)', color: 'primary.dark',
                        '& .MuiChip-label': { px: 0.5 } }} />
                  )}
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <OverdueIcon sx={{ fontSize: 14 }} />
                  Missed
                  {missedCount > 0 && (
                    <Chip label={missedCount} size="small" color="error"
                      sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700,
                        '& .MuiChip-label': { px: 0.5 } }} />
                  )}
                </Box>
              }
            />
          </Tabs>
          <Divider sx={{ flexShrink: 0 }} />

          {/* ── Tab body ── */}
          <Box sx={{ overflowY: 'auto', flexGrow: 1 }}>
            {activeTab === 0 ? (
              <BucketList
                items={upcoming}
                bucket="upcoming"
                serverNow={serverNow}
                onOpen={handleReminderClick}
                onDismiss={handleMarkOneRead}
              />
            ) : (
              <BucketList
                items={missed}
                bucket="missed"
                serverNow={serverNow}
                onOpen={handleReminderClick}
                onDismiss={handleMarkOneRead}
              />
            )}
          </Box>
        </Menu>

        {/* ── Account Menu ───────────────────────────────────────────────── */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{ paper: { sx: { minWidth: 220, mt: 0.5 } } }}
        >
          <Box sx={{ px: 2, py: 1.25 }}>
            <Typography variant="body2" fontWeight={600}>
              {user?.first_name} {user?.last_name}
            </Typography>
            <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => { handleClose(); navigate('/profile'); }}>
            <ListItemIcon><AccountCircle fontSize="small" /></ListItemIcon>
            Manage Profile
          </MenuItem>
          <MenuItem onClick={handleChangePassword}>
            <ListItemIcon><LockIcon fontSize="small" /></ListItemIcon>
            Change Password
          </MenuItem>
          {(user?.is_superuser || user?.permissions?.some((p: string) => p.includes('user') || p.includes('Users'))) && (
            <MenuItem onClick={() => { handleClose(); navigate('/settings'); }}>
              <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
              Settings
            </MenuItem>
          )}
          <Divider sx={{ my: 0.5 }} />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
            Logout
          </MenuItem>
        </Menu>

        <ChangePasswordDialog open={showChangePassword} onClose={() => setShowChangePassword(false)} />
      </Toolbar>
    </MuiAppBar>
  );
};

export default AppBar;
