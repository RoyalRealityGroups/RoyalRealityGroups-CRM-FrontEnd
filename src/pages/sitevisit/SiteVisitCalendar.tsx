import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  TextField,
  Checkbox,
  Collapse,
  useTheme,
  alpha,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  Circle as CircleIcon,
  CalendarMonth as CalendarIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Delete as DeleteIcon,
  CheckBoxOutlineBlank,
  CheckBox as CheckBoxIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { siteVisitApi } from '../../api/siteVisit.api';
import { leadApi } from '../../api/lead.api';
import { projectsApi } from '../../api/projects';
import ScreenHeader from '../../components/common/ScreenHeader';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks';
import HomeIcon from '@mui/icons-material/Home';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import type { SiteVisitCalendarEvent, CalendarColour, CalendarTodo } from '../../types/siteVisit.types';

// Colour configuration for the calendar — matches the status chip colours on the list screen
const COLOUR_CONFIG: Record<CalendarColour, { hex: string; label: string; description: string }> = {
  ORANGE: { hex: '#F97316', label: 'Scheduled',  description: 'Visit scheduled — waiting' },              // orange
  BLUE:   { hex: '#F97316', label: 'Scheduled',  description: 'Visit scheduled — waiting' },              // fallback for existing data
  YELLOW: { hex: '#16A34A', label: 'Completed',  description: 'Site visit completed' },                    // green
  RED:    { hex: '#DC2626', label: 'Cancelled',  description: 'Visit cancelled' },                         // red
  GREEN:  { hex: '#10B981', label: 'Sale Closed', description: 'Lead converted to booking/registration' }, // teal
};

const TODO_COLOUR = '#EC4899'; // Pink for todos — distinct from all visit colours

const DAYS_OF_WEEK = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface CalendarDay {
  date: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  dateStr: string;
  events: SiteVisitCalendarEvent[];
  todos: CalendarTodo[];
}

const SiteVisitCalendar: React.FC = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success: toastSuccess, error: toastError } = useToast();
  usePageTitle('Site Visit Calendar');

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  // Filters
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Legend toggles — click on bottom legend items to toggle visibility
  const [visibleColours, setVisibleColours] = useState<Record<CalendarColour, boolean>>({
    RED: true, YELLOW: true, GREEN: true, BLUE: true, ORANGE: true,
  });
  const [showTodos, setShowTodos] = useState(true);

  // Dialogs
  const [selectedEvent, setSelectedEvent] = useState<SiteVisitCalendarEvent | null>(null);
  const [upcomingOpen, setUpcomingOpen] = useState(false);
  const [todoDialogDate, setTodoDialogDate] = useState<string | null>(null);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  // "+more" popover for a day
  const [moreDialogDate, setMoreDialogDate] = useState<string | null>(null);
  // Edit todo
  const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
  const [editingTodoTitle, setEditingTodoTitle] = useState('');

  // Breadcrumbs
  React.useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Site Visits', path: '/sitevisit/list', icon: <LocationOnIcon fontSize="small" /> },
      { label: 'Calendar', path: '/sitevisit/calendar', icon: <CalendarIcon fontSize="small" /> },
    ]);
  }, [setBreadcrumbs]);

  // Fetch calendar data
  const { data: calendarData, isLoading } = useQuery({
    queryKey: ['site-visit-calendar', currentMonth, currentYear, employeeFilter, projectFilter, statusFilter],
    queryFn: () =>
      siteVisitApi.getCalendar({
        month: currentMonth,
        year: currentYear,
        assigned_employee: employeeFilter || undefined,
        project: projectFilter || undefined,
        status: statusFilter || undefined,
      }),
    staleTime: 30_000,
  });

  // Fetch todos
  const { data: todosData } = useQuery({
    queryKey: ['calendar-todos', currentMonth, currentYear],
    queryFn: () => siteVisitApi.getTodos(currentMonth, currentYear),
    staleTime: 30_000,
  });
  const todos: CalendarTodo[] = todosData || [];

  // Fetch dropdown data
  const { data: usersData } = useQuery({
    queryKey: ['calendar-users'],
    queryFn: () => leadApi.getUsers(),
    staleTime: 5 * 60 * 1000,
  });
  const users: { id: string; name: string }[] = usersData || [];

  const { data: projectsData } = useQuery({
    queryKey: ['calendar-projects'],
    queryFn: () => projectsApi.mini(),
    staleTime: 5 * 60 * 1000,
  });
  const projects: { id: string; name: string }[] = projectsData || [];

  // Todo mutations
  const createTodoMutation = useMutation({
    mutationFn: ({ date, title }: { date: string; title: string }) =>
      siteVisitApi.createTodo(date, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-todos'] });
      setNewTodoTitle('');
      toastSuccess('To-do added');
    },
    onError: () => toastError('Failed to add to-do'),
  });

  const toggleTodoMutation = useMutation({
    mutationFn: ({ id, is_completed }: { id: number; is_completed: boolean }) =>
      siteVisitApi.updateTodo(id, { is_completed }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['calendar-todos'] }),
  });

  const deleteTodoMutation = useMutation({
    mutationFn: (id: number) => siteVisitApi.deleteTodo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-todos'] });
      toastSuccess('To-do removed');
    },
  });

  const editTodoMutation = useMutation({
    mutationFn: ({ id, title }: { id: number; title: string }) =>
      siteVisitApi.updateTodo(id, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-todos'] });
      setEditingTodoId(null);
      setEditingTodoTitle('');
      toastSuccess('To-do updated');
    },
    onError: () => toastError('Failed to update to-do'),
  });

  const handleSaveEdit = (id: number) => {
    if (!editingTodoTitle.trim()) return;
    editTodoMutation.mutate({ id, title: editingTodoTitle.trim() });
  };

  // Navigation
  const goToPrevMonth = () => {
    if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
  };
  const goToNextMonth = () => {
    if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
  };
  const goToToday = () => {
    setCurrentMonth(today.getMonth() + 1);
    setCurrentYear(today.getFullYear());
  };

  // Build calendar grid
  const calendarDays: CalendarDay[] = useMemo(() => {
    const events = calendarData?.events || [];
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const lastDay = new Date(currentYear, currentMonth, 0);
    const daysInMonth = lastDay.getDate();

    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;

    const days: CalendarDay[] = [];

    // Previous month days
    const daysInPrevMonth = new Date(currentYear, currentMonth - 1, 0).getDate();
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const dateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ date: d, month: prevMonth - 1, year: prevYear, isCurrentMonth: false, isToday: false, dateStr, events: [], todos: [] });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = d === today.getDate() && currentMonth - 1 === today.getMonth() && currentYear === today.getFullYear();
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayEvents = events.filter((e) => e.visit_date === dateStr);
      const dayTodos = todos.filter((t) => t.date === dateStr);
      days.push({ date: d, month: currentMonth - 1, year: currentYear, isCurrentMonth: true, isToday, dateStr, events: dayEvents, todos: dayTodos });
    }

    // Next month fill
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const dateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ date: d, month: nextMonth - 1, year: nextYear, isCurrentMonth: false, isToday: false, dateStr, events: [], todos: [] });
    }
    return days;
  }, [calendarData, todos, currentMonth, currentYear, today]);

  const getVisibleEvents = (events: SiteVisitCalendarEvent[]) =>
    events.filter((e) => visibleColours[e.colour]);

  const toggleColour = (colour: CalendarColour) => {
    setVisibleColours((prev) => ({ ...prev, [colour]: !prev[colour] }));
  };

  const handleAddTodo = () => {
    if (!todoDialogDate || !newTodoTitle.trim()) return;
    createTodoMutation.mutate({ date: todoDialogDate, title: newTodoTitle.trim() });
  };

  // Get todos for dialog date
  const dialogTodos = todoDialogDate ? todos.filter((t) => t.date === todoDialogDate) : [];

  const formatDialogDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <Box sx={{ p: 2 }}>
      <ScreenHeader title="Site Visit Calendar" />

      {/* Top Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel shrink>Employee</InputLabel>
            <Select value={employeeFilter} label="Employee" displayEmpty notched onChange={(e) => setEmployeeFilter(e.target.value)}>
              <MenuItem value="">All Employees</MenuItem>
              {users.map((u) => <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel shrink>Project</InputLabel>
            <Select value={projectFilter} label="Project" displayEmpty notched onChange={(e) => setProjectFilter(e.target.value)}>
              <MenuItem value="">All Projects</MenuItem>
              {projects.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel shrink>Status</InputLabel>
            <Select value={statusFilter} label="Status" displayEmpty notched onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="SCHEDULED">Scheduled</MenuItem>
              <MenuItem value="COMPLETED">Completed</MenuItem>
              <MenuItem value="CANCELLED">Cancelled</MenuItem>
            </Select>
          </FormControl>
          {(employeeFilter || projectFilter || statusFilter) && (
            <Button size="small" variant="text" onClick={() => { setEmployeeFilter(''); setProjectFilter(''); setStatusFilter(''); }}>
              Clear Filters
            </Button>
          )}
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Left Sidebar */}
        <Box sx={{ width: { xs: '100%', md: 280 }, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>

          {/* Upcoming This Month — collapsible card */}
          <Paper sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
            <Box
              onClick={() => setUpcomingOpen(!upcomingOpen)}
              sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', userSelect: 'none' }}
            >
              <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CalendarIcon sx={{ color: 'primary.main', fontSize: 20 }} />
              </Box>
              <Typography variant="subtitle1" fontWeight={700}>Upcoming This Month</Typography>
              {calendarData?.events && (
                <Chip
                  label={calendarData.events.filter((e) => e.visit_date >= new Date().toISOString().split('T')[0] && (e.status === 'SCHEDULED')).length}
                  size="small"
                  sx={{ ml: 'auto', height: 26, width: 26, borderRadius: '50%', bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontWeight: 700, fontSize: '0.8rem', '& .MuiChip-label': { p: 0 } }}
                />
              )}
              <IconButton size="small" sx={{ ml: calendarData?.events ? 0.5 : 'auto' }}>
                {upcomingOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>

            <Collapse in={upcomingOpen}>
              {/* Scrollable visit cards */}
              <Box sx={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                {calendarData?.events
                  ?.filter((e) => e.visit_date >= new Date().toISOString().split('T')[0] && (e.status === 'SCHEDULED'))
                  .slice(0, 15)
                  .map((event) => (
                    <Box
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      sx={{
                        p: 1.5, borderRadius: 2, cursor: 'pointer',
                        border: '1px solid', borderColor: 'divider',
                        borderLeft: `4px solid ${COLOUR_CONFIG[event.colour].hex}`,
                        bgcolor: 'background.paper',
                        '&:hover': { boxShadow: 1, borderColor: COLOUR_CONFIG[event.colour].hex },
                        transition: 'all 0.15s',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.3 }}>
                          {event.customer_name}
                        </Typography>
                        <Chip
                          label={event.status_display}
                          size="small"
                          sx={{ height: 18, fontSize: '0.6rem', bgcolor: alpha(COLOUR_CONFIG[event.colour].hex, 0.1), color: COLOUR_CONFIG[event.colour].hex }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {event.project_name || '-'}
                        </Typography>
                        <Chip
                          label={new Date(event.visit_date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          size="small"
                          variant="outlined"
                          sx={{ ml: 'auto', height: 20, fontSize: '0.65rem', borderRadius: 1 }}
                        />
                      </Box>
                    </Box>
                  )) || null}
                {(!calendarData?.events || calendarData.events.filter((e) => e.visit_date >= new Date().toISOString().split('T')[0] && (e.status === 'SCHEDULED')).length === 0) && (
                  <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 3 }}>
                    No upcoming visits this month
                  </Typography>
                )}
              </Box>
            </Collapse>
          </Paper>

          {/* To-Do — isolated card */}
          <Paper sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: 2, bgcolor: alpha(TODO_COLOUR, 0.02) }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha(TODO_COLOUR, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckBoxIcon sx={{ fontSize: 20, color: TODO_COLOUR }} />
              </Box>
              <Typography variant="subtitle1" fontWeight={700}>To-Do</Typography>
              <Tooltip title={showTodos ? 'Hide on calendar' : 'Show on calendar'}>
                <IconButton size="small" onClick={() => setShowTodos(!showTodos)} sx={{ ml: 'auto', p: 0.4 }}>
                  {showTodos ? <VisibilityIcon sx={{ fontSize: 18, color: TODO_COLOUR }} /> : <VisibilityOffIcon sx={{ fontSize: 18, color: 'text.disabled' }} />}
                </IconButton>
              </Tooltip>
              <Chip label={todos.length} size="small" sx={{ height: 22, fontSize: '0.7rem', bgcolor: alpha(TODO_COLOUR, 0.15), color: TODO_COLOUR, fontWeight: 600 }} />
            </Box>

            {/* Todo list — scrollable */}
            <Box sx={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {todos.length === 0 ? (
                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 3 }}>
                  No to-dos this month
                </Typography>
              ) : (
                todos.map((todo) => (
                  <Box key={todo.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, py: 0.5, px: 1, borderRadius: 1.5, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                    <Checkbox
                      size="small"
                      checked={todo.is_completed}
                      onChange={() => toggleTodoMutation.mutate({ id: todo.id, is_completed: !todo.is_completed })}
                      icon={<CheckBoxOutlineBlank sx={{ fontSize: 18, color: TODO_COLOUR }} />}
                      checkedIcon={<CheckBoxIcon sx={{ fontSize: 18, color: TODO_COLOUR }} />}
                      sx={{ p: 0.25 }}
                    />
                    {editingTodoId === todo.id ? (
                      <TextField
                        size="small"
                        fullWidth
                        value={editingTodoTitle}
                        onChange={(e) => setEditingTodoTitle(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(todo.id); if (e.key === 'Escape') { setEditingTodoId(null); setEditingTodoTitle(''); } }}
                        autoFocus
                        sx={{ '& .MuiInputBase-input': { py: 0.3, fontSize: '0.85rem' } }}
                      />
                    ) : (
                      <Typography
                        variant="body2"
                        onDoubleClick={() => { setEditingTodoId(todo.id); setEditingTodoTitle(todo.title); }}
                        sx={{ flex: 1, textDecoration: todo.is_completed ? 'line-through' : 'none', color: todo.is_completed ? 'text.disabled' : 'text.primary', lineHeight: 1.4, cursor: 'text' }}
                      >
                        {todo.title}
                      </Typography>
                    )}
                    {editingTodoId === todo.id ? (
                      <IconButton size="small" onClick={() => handleSaveEdit(todo.id)} sx={{ p: 0.3 }} color="primary">
                        <CheckBoxIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    ) : (
                      <Tooltip title="Edit" placement="top">
                        <IconButton size="small" onClick={() => { setEditingTodoId(todo.id); setEditingTodoTitle(todo.title); }} sx={{ p: 0.3 }}>
                          <CircleIcon sx={{ fontSize: 6, color: 'text.disabled' }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    <IconButton size="small" onClick={() => deleteTodoMutation.mutate(todo.id)} sx={{ p: 0.3 }}>
                      <DeleteIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                    </IconButton>
                  </Box>
                ))
              )}
            </Box>
          </Paper>
        </Box>

        {/* Main Calendar Area */}
        <Paper sx={{ p: 2, flex: 1, minWidth: 0 }}>
          {/* Calendar Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarIcon color="primary" />
              <Typography variant="h6" fontWeight={700}>
                {MONTH_NAMES[currentMonth - 1]} {currentYear}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Button size="small" variant="outlined" startIcon={<TodayIcon />} onClick={goToToday}>Today</Button>
              <IconButton onClick={goToPrevMonth} size="small"><ChevronLeftIcon /></IconButton>
              <IconButton onClick={goToNextMonth} size="small"><ChevronRightIcon /></IconButton>
            </Box>
          </Box>

          {/* Days of Week Header */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: `1px solid ${theme.palette.divider}`, mb: 0.5 }}>
            {DAYS_OF_WEEK.map((day) => (
              <Box key={day} sx={{ py: 1, textAlign: 'center', fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary' }}>
                {day}
              </Box>
            ))}
          </Box>

          {/* Calendar Grid */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: 'repeat(6, 1fr)', minHeight: 520, opacity: isLoading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
            {calendarDays.map((day, idx) => {
              const visibleEvents = getVisibleEvents(day.events);
              const visibleTodos = showTodos ? day.todos : [];
              const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
              const isPast = day.isCurrentMonth && day.dateStr < todayStr;
              return (
                <Box
                  key={idx}
                  onClick={() => { if (day.isCurrentMonth && (day.events.length > 0 || day.todos.length > 0)) setMoreDialogDate(day.dateStr); }}
                  sx={{
                    border: `1px solid ${theme.palette.divider}`,
                    borderTop: 'none',
                    borderLeft: idx % 7 === 0 ? `1px solid ${theme.palette.divider}` : 'none',
                    p: 0.5, minHeight: 80,
                    cursor: day.isCurrentMonth && (day.events.length > 0 || day.todos.length > 0) ? 'pointer' : 'default',
                    bgcolor: isPast
                      ? alpha(theme.palette.action.disabled, 0.06)
                      : day.isToday
                        ? alpha(theme.palette.primary.main, 0.05)
                        : day.isCurrentMonth
                          ? 'background.paper'
                          : alpha(theme.palette.action.disabled, 0.03),
                    '&:hover': day.isCurrentMonth && (day.events.length > 0 || day.todos.length > 0) ? { bgcolor: alpha(theme.palette.primary.main, 0.04) } : {},
                    '&:hover .add-todo-btn': { opacity: 1 },
                    position: 'relative', overflow: 'hidden',
                  }}
                >
                  {/* Date number + hover add-todo icon (only for today and future dates) */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="caption" sx={{
                      fontWeight: day.isToday ? 700 : 400,
                      color: isPast ? 'text.disabled' : day.isCurrentMonth ? 'text.primary' : 'text.disabled',
                      ...(day.isToday && { bgcolor: 'primary.main', color: 'white', borderRadius: '50%', width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }),
                    }}>
                      {day.date}
                    </Typography>
                    {day.isCurrentMonth && !isPast && (
                      <IconButton
                        className="add-todo-btn"
                        size="small"
                        onClick={(e) => { e.stopPropagation(); setTodoDialogDate(day.dateStr); }}
                        sx={{
                          opacity: 0, transition: 'opacity 0.2s',
                          p: 0.2, width: 18, height: 18,
                          bgcolor: alpha(TODO_COLOUR, 0.15),
                          '&:hover': { bgcolor: alpha(TODO_COLOUR, 0.3) },
                        }}
                      >
                        <AddIcon sx={{ fontSize: 12, color: TODO_COLOUR }} />
                      </IconButton>
                    )}
                  </Box>

                  {/* Events */}
                  <Box sx={{ mt: 0.25, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {visibleEvents.slice(0, 2).map((event) => (
                      <Tooltip key={event.id} title={`${event.customer_name} — ${event.project_name} (${event.status_display})`} arrow>
                        <Box
                          onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); }}
                          sx={{
                            px: 0.5, py: '1px', borderRadius: '3px',
                            bgcolor: alpha(COLOUR_CONFIG[event.colour].hex, 0.15),
                            borderLeft: `3px solid ${COLOUR_CONFIG[event.colour].hex}`,
                            cursor: 'pointer', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                            '&:hover': { bgcolor: alpha(COLOUR_CONFIG[event.colour].hex, 0.25) },
                          }}
                        >
                          <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 500, lineHeight: 1.3 }}>
                            {event.customer_name}
                          </Typography>
                        </Box>
                      </Tooltip>
                    ))}
                    {/* Todos on calendar */}
                    {visibleTodos.slice(0, 2 - Math.min(visibleEvents.length, 2)).map((todo) => (
                      <Box key={`todo-${todo.id}`} sx={{
                        px: 0.5, py: '1px', borderRadius: '3px',
                        bgcolor: alpha(TODO_COLOUR, 0.1),
                        borderLeft: `3px solid ${TODO_COLOUR}`,
                        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                      }}>
                        <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 500, lineHeight: 1.3, textDecoration: todo.is_completed ? 'line-through' : 'none', color: todo.is_completed ? 'text.disabled' : 'text.primary' }}>
                          {todo.title}
                        </Typography>
                      </Box>
                    ))}
                    {(visibleEvents.length + visibleTodos.length) > 2 && (
                      <Typography
                        variant="caption"
                        onClick={(e) => { e.stopPropagation(); setMoreDialogDate(day.dateStr); }}
                        sx={{ fontSize: '0.6rem', color: 'primary.main', pl: 0.5, cursor: 'pointer', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
                      >
                        +{visibleEvents.length + visibleTodos.length - 2} more
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>

          {/* Bottom Legend Bar — clickable toggles */}
          <Box sx={{ display: 'flex', gap: 1.5, mt: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>Legend:</Typography>
            {(Object.entries(COLOUR_CONFIG) as [CalendarColour, typeof COLOUR_CONFIG[CalendarColour]][]).filter(
              ([colour]) => colour !== 'BLUE' && colour !== 'GREEN'
            ).map(
              ([colour, config]) => (
                <Chip
                  key={colour}
                  icon={<CircleIcon sx={{ fontSize: '10px !important', color: `${config.hex} !important` }} />}
                  label={config.label}
                  size="small"
                  onClick={() => toggleColour(colour)}
                  variant={visibleColours[colour] ? 'filled' : 'outlined'}
                  sx={{
                    cursor: 'pointer', height: 24, fontSize: '0.7rem',
                    bgcolor: visibleColours[colour] ? alpha(config.hex, 0.1) : 'transparent',
                    borderColor: visibleColours[colour] ? config.hex : 'divider',
                    color: visibleColours[colour] ? 'text.primary' : 'text.disabled',
                    '&:hover': { bgcolor: alpha(config.hex, 0.15) },
                  }}
                />
              )
            )}
            {/* Todos toggle in legend */}
            <Chip
              icon={<CheckBoxIcon sx={{ fontSize: '12px !important', color: `${TODO_COLOUR} !important` }} />}
              label="To-Dos"
              size="small"
              onClick={() => setShowTodos(!showTodos)}
              variant={showTodos ? 'filled' : 'outlined'}
              sx={{
                cursor: 'pointer', height: 24, fontSize: '0.7rem',
                bgcolor: showTodos ? alpha(TODO_COLOUR, 0.1) : 'transparent',
                borderColor: showTodos ? TODO_COLOUR : 'divider',
                color: showTodos ? 'text.primary' : 'text.disabled',
                '&:hover': { bgcolor: alpha(TODO_COLOUR, 0.15) },
              }}
            />
          </Box>
        </Paper>
      </Box>

      {/* To-Do Dialog — opens when clicking the + icon on a date */}
      <Dialog open={!!todoDialogDate} onClose={() => { setTodoDialogDate(null); setNewTodoTitle(''); setEditingTodoId(null); }} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarIcon sx={{ color: 'primary.main' }} />
          To-Do for {todoDialogDate ? formatDialogDate(todoDialogDate) : ''}
        </DialogTitle>
        <DialogContent>
          {/* Add new todo */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Add new to-do..."
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddTodo(); }}
            />
            <IconButton
              color="primary"
              onClick={handleAddTodo}
              disabled={!newTodoTitle.trim() || createTodoMutation.isPending}
              sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' }, borderRadius: 1, width: 40, height: 40 }}
            >
              <AddIcon />
            </IconButton>
          </Box>

          {/* Existing todos for this date */}
          {dialogTodos.length === 0 ? (
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 2 }}>
              No to-do for this date
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, maxHeight: 250, overflowY: 'auto' }}>
              {dialogTodos.map((todo) => (
                <Box key={todo.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5, px: 1, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                  <Checkbox
                    size="small"
                    checked={todo.is_completed}
                    onChange={() => toggleTodoMutation.mutate({ id: todo.id, is_completed: !todo.is_completed })}
                    sx={{ p: 0.25 }}
                  />
                  {editingTodoId === todo.id ? (
                    <TextField
                      size="small"
                      fullWidth
                      value={editingTodoTitle}
                      onChange={(e) => setEditingTodoTitle(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(todo.id); if (e.key === 'Escape') { setEditingTodoId(null); setEditingTodoTitle(''); } }}
                      autoFocus
                      sx={{ '& .MuiInputBase-input': { py: 0.5, fontSize: '0.875rem' } }}
                    />
                  ) : (
                    <Typography
                      variant="body2"
                      onDoubleClick={() => { setEditingTodoId(todo.id); setEditingTodoTitle(todo.title); }}
                      sx={{ flex: 1, textDecoration: todo.is_completed ? 'line-through' : 'none', color: todo.is_completed ? 'text.disabled' : 'text.primary', cursor: 'text' }}
                    >
                      {todo.title}
                    </Typography>
                  )}
                  {editingTodoId === todo.id ? (
                    <IconButton size="small" onClick={() => handleSaveEdit(todo.id)} color="primary">
                      <CheckBoxIcon fontSize="small" />
                    </IconButton>
                  ) : (
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => { setEditingTodoId(todo.id); setEditingTodoTitle(todo.title); }}>
                        <CircleIcon sx={{ fontSize: 6, color: 'text.disabled' }} />
                      </IconButton>
                    </Tooltip>
                  )}
                  <IconButton size="small" onClick={() => deleteTodoMutation.mutate(todo.id)}>
                    <DeleteIcon fontSize="small" color="error" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setTodoDialogDate(null); setNewTodoTitle(''); setEditingTodoId(null); }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* "+More" Dialog — shows all events & todos for a day with scroll */}
      <Dialog open={!!moreDialogDate} onClose={() => setMoreDialogDate(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarIcon sx={{ color: 'primary.main' }} />
          All items for {moreDialogDate ? formatDialogDate(moreDialogDate) : ''}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ maxHeight: 350, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
            {/* Site visit events for this date */}
            {calendarData?.events
              ?.filter((e) => e.visit_date === moreDialogDate && visibleColours[e.colour])
              .map((event) => (
                <Box
                  key={event.id}
                  onClick={() => { setMoreDialogDate(null); setSelectedEvent(event); }}
                  sx={{
                    p: 1.5, borderRadius: 2, cursor: 'pointer',
                    border: '1px solid', borderColor: 'divider',
                    '&:hover': { boxShadow: 1, bgcolor: alpha(COLOUR_CONFIG[event.colour].hex, 0.05) },
                  }}
                >
                  <Typography variant="body2" fontWeight={600}>{event.customer_name}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">{event.project_name || '-'}</Typography>
                    <Chip label={event.status_display} size="small" sx={{ ml: 'auto', height: 18, fontSize: '0.6rem', bgcolor: alpha(COLOUR_CONFIG[event.colour].hex, 0.1), color: COLOUR_CONFIG[event.colour].hex }} />
                  </Box>
                </Box>
              ))}
            {/* Todos for this date */}
            {showTodos && todos
              .filter((t) => t.date === moreDialogDate)
              .map((todo) => (
                <Box
                  key={`todo-${todo.id}`}
                  sx={{
                    p: 1.5, borderRadius: 2,
                    border: '1px solid', borderColor: 'divider',
                    borderLeft: `4px solid ${TODO_COLOUR}`,
                    display: 'flex', alignItems: 'center', gap: 1,
                  }}
                >
                  <Checkbox
                    size="small"
                    checked={todo.is_completed}
                    onChange={() => toggleTodoMutation.mutate({ id: todo.id, is_completed: !todo.is_completed })}
                    sx={{ p: 0.25 }}
                  />
                  <Typography variant="body2" sx={{ flex: 1, textDecoration: todo.is_completed ? 'line-through' : 'none', color: todo.is_completed ? 'text.disabled' : 'text.primary' }}>
                    {todo.title}
                  </Typography>
                </Box>
              ))}
            {/* Empty state */}
            {(!calendarData?.events?.filter((e) => e.visit_date === moreDialogDate && visibleColours[e.colour]).length &&
              !todos.filter((t) => t.date === moreDialogDate).length) && (
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 2 }}>
                No items for this date
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMoreDialogDate(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Event Detail Dialog */}
      <Dialog open={!!selectedEvent} onClose={() => setSelectedEvent(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {selectedEvent && <CircleIcon sx={{ fontSize: 14, color: COLOUR_CONFIG[selectedEvent.colour].hex }} />}
          Site Visit Details
        </DialogTitle>
        {selectedEvent && (
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Customer Name</Typography>
                <Typography variant="body1" fontWeight={500}>{selectedEvent.customer_name}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Project</Typography>
                <Typography variant="body1">{selectedEvent.project_name || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Visit Date</Typography>
                <Typography variant="body1">
                  {new Date(selectedEvent.visit_date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Assigned Employee</Typography>
                <Typography variant="body1">{selectedEvent.assigned_employee_name || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Visit Status</Typography>
                <Chip label={selectedEvent.status_display} size="small" sx={{ mt: 0.5, bgcolor: alpha(COLOUR_CONFIG[selectedEvent.colour].hex, 0.15), color: COLOUR_CONFIG[selectedEvent.colour].hex, fontWeight: 600 }} />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Lead Status</Typography>
                <Typography variant="body1">{selectedEvent.lead_status || 'N/A'}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Classification</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                  <CircleIcon sx={{ fontSize: 10, color: COLOUR_CONFIG[selectedEvent.colour].hex }} />
                  <Typography variant="body2">{COLOUR_CONFIG[selectedEvent.colour].description}</Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Code</Typography>
                <Typography variant="body1">{selectedEvent.code || '-'}</Typography>
              </Grid>
              {selectedEvent.remarks && (
                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="caption" color="text.secondary">Remarks</Typography>
                  <Typography variant="body2">{selectedEvent.remarks}</Typography>
                </Grid>
              )}
            </Grid>
          </DialogContent>
        )}
        <DialogActions>
          <Button onClick={() => setSelectedEvent(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SiteVisitCalendar;
