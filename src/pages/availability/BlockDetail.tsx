import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Grid, Typography, Chip, Paper, Skeleton, Button,
  ToggleButton, ToggleButtonGroup, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, Divider, Select, MenuItem,
  FormControl, InputLabel, alpha, CircularProgress, IconButton,
} from '@mui/material';
import {
  ArrowBack, FilterList as FilterIcon, Edit as EditIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { availabilityApi } from '../../api/availability.api';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks';
import ScreenHeader from '../../components/common/ScreenHeader';
import { getPageContainerStyles, getHeaderSectionStyles, getContentSectionStyles, APP_PRIMARY_COLOR } from '../../utils/spacing';
import {
  UNIT_STATUS_COLORS, UNIT_STATUS_BG, UNIT_STATUS_LABELS,
} from '../../types/availability.types';
import type { AvailabilityUnit, UnitStatus } from '../../types/availability.types';
import HomeIcon from '@mui/icons-material/Home';
import ListAltIcon from '@mui/icons-material/ListAlt';

// ─── status legend ────────────────────────────────────────────────────────────
const Legend = () => (
  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
    {(Object.keys(UNIT_STATUS_LABELS) as UnitStatus[]).map((s) => (
      <Box key={s} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <Box sx={{
          width: 16, height: 16, borderRadius: 0.75,
          backgroundColor: UNIT_STATUS_BG[s],
          border: `2px solid ${UNIT_STATUS_COLORS[s]}`,
        }} />
        <Typography variant="caption">{UNIT_STATUS_LABELS[s]}</Typography>
      </Box>
    ))}
  </Box>
);

// ─── single unit cell ─────────────────────────────────────────────────────────
const UnitCell: React.FC<{
  unit: AvailabilityUnit;
  onClick: (u: AvailabilityUnit) => void;
}> = ({ unit, onClick }) => {
  const color = UNIT_STATUS_COLORS[unit.status];
  const bg = UNIT_STATUS_BG[unit.status];
  const label = UNIT_STATUS_LABELS[unit.status];

  return (
    <Tooltip
      title={
        <Box>
          <Typography variant="caption" fontWeight={700}>{unit.unit_number}</Typography><br />
          <Typography variant="caption">{label}</Typography>
          {unit.unit_type && <><br /><Typography variant="caption">{unit.unit_type}</Typography></>}
          {unit.floor != null && <><br /><Typography variant="caption">Floor {unit.floor}</Typography></>}
          {unit.price && <><br /><Typography variant="caption">₹{Number(unit.price).toLocaleString()}</Typography></>}
        </Box>
      }
      arrow
    >
      <Box
        onClick={() => onClick(unit)}
        sx={{
          width: '100%', aspectRatio: '1', borderRadius: 1.5, cursor: 'pointer',
          backgroundColor: bg, border: `2px solid ${color}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s ease',
          '&:hover': {
            transform: 'scale(1.08)',
            boxShadow: `0 4px 16px ${alpha(color, 0.4)}`,
            zIndex: 2, position: 'relative',
          },
        }}
      >
        <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color, lineHeight: 1, textAlign: 'center', px: 0.25 }}>
          {unit.unit_number}
        </Typography>
        {unit.floor != null && (
          <Typography sx={{ fontSize: '0.5rem', color, opacity: 0.7, lineHeight: 1, mt: 0.25 }}>
            F{unit.floor}
          </Typography>
        )}
      </Box>
    </Tooltip>
  );
};

// ─── floor section ─────────────────────────────────────────────────────────────
const FloorRow: React.FC<{
  floor: number | null; units: AvailabilityUnit[]; onUnitClick: (u: AvailabilityUnit) => void;
}> = ({ floor, units, onUnitClick }) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1.5 }}>
    <Box sx={{
      minWidth: 48, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: 1, backgroundColor: '#F3F4F6',
    }}>
      <Typography variant="caption" fontWeight={700} color="text.secondary">
        {floor != null ? `F${floor}` : '—'}
      </Typography>
    </Box>
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(46px, 1fr))', gap: 0.75, flex: 1 }}>
      {units.map((u) => <UnitCell key={u.id} unit={u} onClick={onUnitClick} />)}
    </Box>
  </Box>
);

// ─── unit detail dialog ───────────────────────────────────────────────────────
const UnitDetailDialog: React.FC<{
  unit: AvailabilityUnit | null;
  open: boolean;
  onClose: () => void;
  onStatusChange: (unitId: string, status: UnitStatus) => void;
  choices: any;
  updating: boolean;
}> = ({ unit, open, onClose, onStatusChange, choices, updating }) => {
  const [newStatus, setNewStatus] = useState<UnitStatus | ''>('');
  useEffect(() => { if (unit) setNewStatus(unit.status); }, [unit]);

  if (!unit) return null;
  const color = UNIT_STATUS_COLORS[unit.status];
  const bg = UNIT_STATUS_BG[unit.status];

  const rows = [
    ['Unit Number', unit.unit_number],
    ['Block', unit.block_name],
    ['Project', unit.project_name],
    ['Type', unit.unit_type_display ?? unit.unit_type],
    ['Floor', unit.floor != null ? `Floor ${unit.floor}` : null],
    ['Area (sq.ft)', unit.area_sqft ? `${unit.area_sqft} sq.ft` : null],
    ['Area (sq.yd)', unit.area_sqyd ? `${unit.area_sqyd} sq.yd` : null],
    ['Carpet Area', unit.carpet_area_sqft ? `${unit.carpet_area_sqft} sq.ft` : null],
    ['Facing', unit.facing_display ?? unit.facing],
    ['Price', unit.price ? `₹${Number(unit.price).toLocaleString()}` : null],
    ['Remarks', unit.remarks],
  ].filter(([, v]) => v);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      {/* coloured header */}
      <Box sx={{ background: `linear-gradient(135deg, ${color} 0%, ${alpha(color, 0.7)} 100%)`, p: 2.5, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h5" fontWeight={800} color="#fff">{unit.unit_number}</Typography>
            <Chip
              label={UNIT_STATUS_LABELS[unit.status]}
              size="small"
              sx={{ mt: 0.5, backgroundColor: alpha('#fff', 0.25), color: '#fff', fontWeight: 700, fontSize: '0.75rem' }}
            />
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ color: '#fff' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <DialogContent sx={{ pt: 2 }}>
        {/* detail grid */}
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          {rows.map(([label, value]) => (
            <Grid key={label as string} size={{ xs: 6 }}>
              <Typography variant="caption" color="text.secondary">{label as string}</Typography>
              <Typography variant="body2" fontWeight={500}>{value as string}</Typography>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ mb: 2 }} />

        {/* status change */}
        <Typography variant="subtitle2" fontWeight={700} gutterBottom>Update Status</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {(Object.keys(UNIT_STATUS_LABELS) as UnitStatus[]).map((s) => (
            <Box key={s} onClick={() => setNewStatus(s)} sx={{
              flex: 1, py: 1, borderRadius: 1.5, cursor: 'pointer', textAlign: 'center',
              border: `2px solid ${newStatus === s ? UNIT_STATUS_COLORS[s] : '#E5E7EB'}`,
              backgroundColor: newStatus === s ? UNIT_STATUS_BG[s] : 'transparent',
              transition: 'all 0.15s',
            }}>
              <Typography variant="caption" fontWeight={newStatus === s ? 700 : 400}
                sx={{ color: newStatus === s ? UNIT_STATUS_COLORS[s] : 'text.secondary', fontSize: '0.65rem' }}>
                {UNIT_STATUS_LABELS[s]}
              </Typography>
            </Box>
          ))}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 2.5, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={updating || newStatus === unit.status || !newStatus}
          onClick={() => newStatus && onStatusChange(unit.id, newStatus as UnitStatus)}
          startIcon={updating ? <CircularProgress size={14} color="inherit" /> : undefined}
          sx={{ borderRadius: 2 }}
        >
          Update Status
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── stat card ────────────────────────────────────────────────────────────────
const StatCard: React.FC<{ label: string; value: number; color: string; bg: string; total: number }> = ({
  label, value, color, bg, total,
}) => (
  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: 'center', border: `1px solid ${color}30`, backgroundColor: bg }}>
    <Typography variant="h4" fontWeight={800} sx={{ color, lineHeight: 1 }}>{value}</Typography>
    <Typography variant="caption" sx={{ color, opacity: 0.8 }}>{label}</Typography>
    {total > 0 && (
      <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.25 }}>
        {Math.round((value / total) * 100)}%
      </Typography>
    )}
  </Paper>
);

// ─── main page ────────────────────────────────────────────────────────────────
const BlockDetail: React.FC = () => {
  const navigate = useNavigate();
  const { projectId, blockId } = useParams<{ projectId: string; blockId: string }>();
  const qc = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success, error: toastError } = useToast();

  const [filterStatus, setFilterStatus] = useState<UnitStatus | 'ALL'>('ALL');
  const [selectedUnit, setSelectedUnit] = useState<AvailabilityUnit | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: block, isLoading: loadingBlock } = useQuery({
    queryKey: ['avail-block', blockId],
    queryFn: () => availabilityApi.getBlock(blockId!),
    enabled: !!blockId,
  });

  const { data: units = [], isLoading: loadingUnits } = useQuery({
    queryKey: ['avail-block-units', blockId],
    queryFn: () => availabilityApi.getBlockUnits(blockId!),
    enabled: !!blockId,
  });

  const { data: project } = useQuery({
    queryKey: ['avail-project', projectId],
    queryFn: () => availabilityApi.getProject(projectId!),
    enabled: !!projectId,
    staleTime: 60_000,
  });

  const { data: choices } = useQuery({
    queryKey: ['avail-choices'],
    queryFn: () => availabilityApi.getChoices(),
    staleTime: 10 * 60_000,
  });

  usePageTitle(block?.name ?? 'Block Detail');

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Availability', path: '/availability/projects', icon: <ListAltIcon fontSize="small" /> },
      { label: project?.name ?? '…', path: `/availability/projects/${projectId}` },
      { label: block?.name ?? '…' },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs, project?.name, block?.name, projectId]);

  const statusMutation = useMutation({
    mutationFn: ({ unitId, status }: { unitId: string; status: UnitStatus }) =>
      availabilityApi.updateUnitStatus(unitId, status),
    onSuccess: (updated) => {
      success(`Status updated to ${UNIT_STATUS_LABELS[updated.status]}`);
      qc.invalidateQueries({ queryKey: ['avail-block-units', blockId] });
      qc.invalidateQueries({ queryKey: ['avail-block', blockId] });
      qc.invalidateQueries({ queryKey: ['avail-project', projectId] });
      qc.invalidateQueries({ queryKey: ['avail-projects'] });
      setSelectedUnit(updated);
    },
    onError: () => toastError('Failed to update status'),
  });

  // group by floor
  const byFloor = useMemo(() => {
    const filtered = filterStatus === 'ALL' ? units : units.filter((u) => u.status === filterStatus);
    const map = new Map<number | null, AvailabilityUnit[]>();
    filtered.forEach((u) => {
      const f = u.floor ?? null;
      if (!map.has(f)) map.set(f, []);
      map.get(f)!.push(u);
    });
    // sort: numeric floors ascending, null last
    return Array.from(map.entries()).sort(([a], [b]) => {
      if (a === null && b === null) return 0;
      if (a === null) return 1;
      if (b === null) return -1;
      return a - b;
    });
  }, [units, filterStatus]);

  const isLoading = loadingBlock || loadingUnits;
  const total = units.length;
  const available  = units.filter((u) => u.status === 'AVAILABLE').length;
  const blocked    = units.filter((u) => u.status === 'BLOCKED').length;
  const booked     = units.filter((u) => u.status === 'BOOKED').length;
  const registered = units.filter((u) => u.status === 'REGISTERED').length;

  return (
    <Box sx={getPageContainerStyles()}>
      <Box sx={getHeaderSectionStyles()}>
        <ScreenHeader
          title={block?.name ?? '…'}
          subtitle={project?.name}
          showBackButton
          onBack={() => navigate(`/availability/projects/${projectId}`)}
          showAddButton={false}
        />
      </Box>

      <Box sx={getContentSectionStyles()}>
        {isLoading ? (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}><Skeleton height={100} /></Grid>
            {[...Array(12)].map((_, i) => (
              <Grid key={i} size={{ xs: 2, sm: 1 }}>
                <Skeleton variant="rounded" sx={{ aspectRatio: '1' }} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <>
            {/* stat cards */}
            <Grid container spacing={1.5} sx={{ mb: 3 }}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <StatCard label="Available" value={available} color={UNIT_STATUS_COLORS.AVAILABLE}
                  bg={UNIT_STATUS_BG.AVAILABLE} total={total} />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <StatCard label="Blocked" value={blocked} color={UNIT_STATUS_COLORS.BLOCKED}
                  bg={UNIT_STATUS_BG.BLOCKED} total={total} />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <StatCard label="Booked" value={booked} color={UNIT_STATUS_COLORS.BOOKED}
                  bg={UNIT_STATUS_BG.BOOKED} total={total} />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <StatCard label="Registered" value={registered} color={UNIT_STATUS_COLORS.REGISTERED}
                  bg={UNIT_STATUS_BG.REGISTERED} total={total} />
              </Grid>
            </Grid>

            {/* filter + legend */}
            <Paper variant="outlined" sx={{ p: 2, mb: 2.5, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <FilterIcon fontSize="small" color="action" />
                  <Typography variant="body2" fontWeight={600}>Filter:</Typography>
                </Box>
                <ToggleButtonGroup
                  value={filterStatus}
                  exclusive
                  onChange={(_, v) => v && setFilterStatus(v)}
                  size="small"
                >
                  <ToggleButton value="ALL" sx={{ px: 1.5, fontSize: '0.75rem' }}>All ({total})</ToggleButton>
                  {(Object.keys(UNIT_STATUS_LABELS) as UnitStatus[]).map((s) => {
                    const cnt = units.filter((u) => u.status === s).length;
                    return (
                      <ToggleButton key={s} value={s} sx={{
                        px: 1.5, fontSize: '0.75rem',
                        '&.Mui-selected': {
                          backgroundColor: UNIT_STATUS_BG[s],
                          color: UNIT_STATUS_COLORS[s],
                          borderColor: UNIT_STATUS_COLORS[s],
                        },
                      }}>
                        {UNIT_STATUS_LABELS[s]} ({cnt})
                      </ToggleButton>
                    );
                  })}
                </ToggleButtonGroup>
                <Box sx={{ ml: 'auto' }}><Legend /></Box>
              </Box>
            </Paper>

            {/* grid */}
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
                {filterStatus === 'ALL' ? `All ${total} Units` : `${UNIT_STATUS_LABELS[filterStatus as UnitStatus]} (${byFloor.reduce((s, [, u]) => s + u.length, 0)})`}
              </Typography>

              {byFloor.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                  No units match the current filter.
                </Typography>
              ) : (
                byFloor.map(([floor, floorUnits]) => (
                  <FloorRow key={String(floor)} floor={floor} units={floorUnits}
                    onUnitClick={(u) => { setSelectedUnit(u); setDialogOpen(true); }} />
                ))
              )}
            </Paper>
          </>
        )}
      </Box>

      <UnitDetailDialog
        unit={selectedUnit}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        choices={choices}
        updating={statusMutation.isPending}
        onStatusChange={(unitId, status) =>
          statusMutation.mutate({ unitId, status })
        }
      />
    </Box>
  );
};

export default BlockDetail;
