import React, { useEffect, useState, useRef } from 'react';
import {
  Box, Stepper, Step, StepLabel, Button, Typography, TextField,
  FormControl, InputLabel, Select, MenuItem, Grid, Paper, Divider,
  IconButton, Tooltip, Table, TableHead, TableRow, TableCell,
  TableBody, Chip, CircularProgress, Alert, alpha,
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon, ArrowBack, ArrowForward,
  Save as SaveIcon, Close as CloseIcon, InsertDriveFile as FileIcon,
  OpenInNew as OpenIcon, Image as ImageIcon,
} from '@mui/icons-material';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { availabilityApi } from '../../api/availability.api';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks';
import ScreenHeader from '../../components/common/ScreenHeader';
import {
  getPageContainerStyles, getHeaderSectionStyles, getContentSectionStyles,
} from '../../utils/spacing';
import type {
  AvailabilityProjectFormData, WizardBlock, WizardUnit, UnitStatus,
} from '../../types/availability.types';
import HomeIcon from '@mui/icons-material/Home';
import ListAltIcon from '@mui/icons-material/ListAlt';

// ─── constants ────────────────────────────────────────────────────────────────
const STEPS = ['Project Details', 'Blocks / Sections', 'Units per Block', 'Review & Save'];

const emptyProject: AvailabilityProjectFormData = {
  name: '', developer_name: '', project_type: 'FLATS', location: '', city: '',
  total_area: '', price_range_min: '', price_range_max: '', approval_type: 'PENDING',
  approval_number: '', status: 'ACTIVE', possession_date: '', contact_person: '',
  contact_phone: '', description: '', amenities: '', rera_number: '',
  thumbnail: null, brochure: null,
  existingThumbnailUrl: null, existingBrochureUrl: null,
};

const mkBlock = (order: number): WizardBlock => ({
  tempId: `new-${Date.now()}-${order}`,
  name: '', description: '', total_floors: '', order, units: [],
});

const mkUnit = (): WizardUnit => ({
  tempId: `u-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  unit_number: '', unit_type: '', floor: '', area_sqft: '', area_sqyd: '',
  carpet_area_sqft: '', facing: '', price: '', status: 'AVAILABLE', remarks: '',
});

// ─── Step 1: Project Details ──────────────────────────────────────────────────
const StepDetails: React.FC<{
  form: AvailabilityProjectFormData;
  setForm: React.Dispatch<React.SetStateAction<AvailabilityProjectFormData>>;
  choices: any;
  isView: boolean;
}> = ({ form, setForm, choices, isView }) => {
  const upd = (field: keyof AvailabilityProjectFormData, val: any) =>
    setForm((f) => ({ ...f, [field]: val }));

  return (
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField required fullWidth size="small" label="Project Name" disabled={isView}
          value={form.name} onChange={(e) => upd('name', e.target.value)} />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField fullWidth size="small" label="Developer / Builder" disabled={isView}
          value={form.developer_name} onChange={(e) => upd('developer_name', e.target.value)} />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <FormControl fullWidth size="small" required>
          <InputLabel>Project Type</InputLabel>
          <Select label="Project Type" value={form.project_type} disabled={isView}
            onChange={(e) => upd('project_type', e.target.value)}>
            {(choices?.project_types ?? []).map((c: any) =>
              <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
          </Select>
        </FormControl>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={form.status} disabled={isView}
            onChange={(e) => upd('status', e.target.value)}>
            {(choices?.project_statuses ?? []).map((c: any) =>
              <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
          </Select>
        </FormControl>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Approval Type</InputLabel>
          <Select label="Approval Type" value={form.approval_type} disabled={isView}
            onChange={(e) => upd('approval_type', e.target.value)}>
            {(choices?.approval_types ?? []).map((c: any) =>
              <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
          </Select>
        </FormControl>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField fullWidth size="small" label="Location / Address" disabled={isView}
          value={form.location} onChange={(e) => upd('location', e.target.value)} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" label="City" disabled={isView}
          value={form.city} onChange={(e) => upd('city', e.target.value)} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" label="Total Area (e.g. 2.5 Acres)" disabled={isView}
          value={form.total_area} onChange={(e) => upd('total_area', e.target.value)} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" label="Price Range Min (₹)" type="number" disabled={isView}
          value={form.price_range_min} onChange={(e) => upd('price_range_min', e.target.value)} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" label="Price Range Max (₹)" type="number" disabled={isView}
          value={form.price_range_max} onChange={(e) => upd('price_range_max', e.target.value)} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" label="Possession Date" type="date"
          InputLabelProps={{ shrink: true }} disabled={isView}
          value={form.possession_date} onChange={(e) => upd('possession_date', e.target.value)} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" label="Approval Number" disabled={isView}
          value={form.approval_number} onChange={(e) => upd('approval_number', e.target.value)} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" label="RERA Number" disabled={isView}
          value={form.rera_number} onChange={(e) => upd('rera_number', e.target.value)} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" label="Contact Person" disabled={isView}
          value={form.contact_person} onChange={(e) => upd('contact_person', e.target.value)} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" label="Contact Phone" disabled={isView}
          value={form.contact_phone} onChange={(e) => upd('contact_phone', e.target.value)} />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField fullWidth size="small" label="Description" multiline rows={3} disabled={isView}
          value={form.description} onChange={(e) => upd('description', e.target.value)} />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextField fullWidth size="small" label="Amenities (comma-separated)" multiline rows={2}
          disabled={isView} value={form.amenities}
          onChange={(e) => upd('amenities', e.target.value)}
          placeholder="Swimming Pool, Gym, Clubhouse, 24/7 Security…" />
      </Grid>
      {/* Thumbnail */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={1}>
          Thumbnail Image
        </Typography>
        {/* existing thumbnail from server */}
        {form.existingThumbnailUrl && !form.thumbnail && (
          <Box sx={{ mb: 1.5, position: 'relative', display: 'inline-block' }}>
            <Box
              component="img"
              src={form.existingThumbnailUrl}
              alt="Current thumbnail"
              sx={{
                width: 160, height: 100, objectFit: 'cover',
                borderRadius: 2, border: '1px solid', borderColor: 'divider',
                display: 'block',
              }}
            />
            <Typography variant="caption" color="success.main" sx={{ mt: 0.5, display: 'block' }}>
              ✓ Current thumbnail
            </Typography>
            {!isView && (
              <Typography variant="caption" color="text.secondary" display="block">
                Upload a new file to replace it.
              </Typography>
            )}
          </Box>
        )}
        {/* new file picked preview */}
        {form.thumbnail instanceof File && (
          <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1,
            p: 1, borderRadius: 1.5, border: '1px solid', borderColor: 'success.light',
            backgroundColor: '#f0fdf4' }}>
            <Box component="img"
              src={URL.createObjectURL(form.thumbnail)}
              alt="New thumbnail"
              sx={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 1 }}
            />
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="caption" fontWeight={600} noWrap>{(form.thumbnail as File).name}</Typography>
              <Typography variant="caption" color="text.secondary" display="block">New file selected</Typography>
            </Box>
            {!isView && (
              <IconButton size="small" onClick={() => upd('thumbnail', null)}>
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        )}
        {!isView && (
          <Button component="label" variant="outlined" size="small" startIcon={<ImageIcon />}
            sx={{ borderRadius: 1.5 }}>
            {form.existingThumbnailUrl ? 'Replace Image' : 'Upload Thumbnail'}
            <input type="file" accept="image/*" hidden
              onChange={(e) => upd('thumbnail', e.target.files?.[0] ?? null)} />
          </Button>
        )}
      </Grid>

      {/* Brochure */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={1}>
          Brochure (PDF / image)
        </Typography>
        {/* existing brochure from server */}
        {form.existingBrochureUrl && !form.brochure && (
          <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1,
            p: 1, borderRadius: 1.5, border: '1px solid', borderColor: 'divider',
            backgroundColor: '#f8fafc' }}>
            <FileIcon color="primary" />
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="caption" fontWeight={600} noWrap>Current Brochure</Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {!isView && 'Upload a new file to replace.'}
              </Typography>
            </Box>
            <Tooltip title="Open brochure">
              <IconButton size="small" component="a" href={form.existingBrochureUrl} target="_blank">
                <OpenIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
        {/* new file picked */}
        {form.brochure instanceof File && (
          <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1,
            p: 1, borderRadius: 1.5, border: '1px solid', borderColor: 'success.light',
            backgroundColor: '#f0fdf4' }}>
            <FileIcon color="success" />
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="caption" fontWeight={600} noWrap>{(form.brochure as File).name}</Typography>
              <Typography variant="caption" color="text.secondary" display="block">New file selected</Typography>
            </Box>
            {!isView && (
              <IconButton size="small" onClick={() => upd('brochure', null)}>
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        )}
        {!isView && (
          <Button component="label" variant="outlined" size="small" startIcon={<FileIcon />}
            sx={{ borderRadius: 1.5 }}>
            {form.existingBrochureUrl ? 'Replace Brochure' : 'Upload Brochure'}
            <input type="file" accept=".pdf,image/*" hidden
              onChange={(e) => upd('brochure', e.target.files?.[0] ?? null)} />
          </Button>
        )}
      </Grid>
    </Grid>
  );
};

// ─── Step 2: Blocks ───────────────────────────────────────────────────────────
const StepBlocks: React.FC<{
  projectType: string;
  blocks: WizardBlock[];
  setBlocks: React.Dispatch<React.SetStateAction<WizardBlock[]>>;
  deletedBlockIds: React.MutableRefObject<string[]>;
  isView: boolean;
}> = ({ projectType, blocks, setBlocks, deletedBlockIds, isView }) => {
  const isPlots = projectType === 'PLOTS';
  const hint = isPlots
    ? 'For a plot layout, add one block per zone (or just one "Plots" block).'
    : 'Add one block per tower / wing / section.';

  const addBlock = () =>
    setBlocks((prev) => [...prev, mkBlock(prev.length)]);

  const removeBlock = (tempId: string) => {
    // If tempId is a real UUID (loaded from server), track for deletion
    if (/^[0-9a-f-]{36}$/i.test(tempId)) {
      deletedBlockIds.current = [...deletedBlockIds.current, tempId];
    }
    setBlocks((prev) => prev.filter((b) => b.tempId !== tempId));
  };

  const upd = (tempId: string, field: keyof WizardBlock, val: any) =>
    setBlocks((prev) => prev.map((b) => b.tempId === tempId ? { ...b, [field]: val } : b));

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>{hint}</Alert>
      {blocks.map((block, idx) => (
        <Paper key={block.tempId} variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              Block {idx + 1}
              {/^[0-9a-f-]{36}$/i.test(block.tempId) && (
                <Chip label="Existing" size="small" color="success" variant="outlined"
                  sx={{ ml: 1, fontSize: '0.65rem', height: 18 }} />
              )}
            </Typography>
            {!isView && blocks.length > 1 && (
              <Tooltip title="Remove block">
                <IconButton size="small" color="error" onClick={() => removeBlock(block.tempId)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField required fullWidth size="small" disabled={isView}
                label="Block / Tower Name" placeholder="e.g. Block A, Tower 1"
                value={block.name} onChange={(e) => upd(block.tempId, 'name', e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField fullWidth size="small" type="number" disabled={isView}
                label="Total Floors" placeholder="e.g. 12"
                value={block.total_floors}
                onChange={(e) => upd(block.tempId, 'total_floors', e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <TextField fullWidth size="small" disabled={isView}
                label="Description (optional)" value={block.description}
                onChange={(e) => upd(block.tempId, 'description', e.target.value)} />
            </Grid>
          </Grid>
        </Paper>
      ))}
      {!isView && (
        <Button startIcon={<AddIcon />} variant="outlined" onClick={addBlock} sx={{ borderRadius: 2 }}>
          Add {isPlots ? 'Zone / Block' : 'Tower / Block'}
        </Button>
      )}
    </Box>
  );
};

// ─── Step 3: Units per Block ──────────────────────────────────────────────────
const StepUnits: React.FC<{
  blocks: WizardBlock[];
  setBlocks: React.Dispatch<React.SetStateAction<WizardBlock[]>>;
  choices: any;
  isView: boolean;
  projectType: string;
}> = ({ blocks, setBlocks, choices, isView, projectType }) => {
  const isPlots = projectType === 'PLOTS';

  const addUnit = (blockTempId: string) =>
    setBlocks((prev) => prev.map((b) =>
      b.tempId === blockTempId ? { ...b, units: [...b.units, mkUnit()] } : b,
    ));

  const removeUnit = (blockTempId: string, unitTempId: string) =>
    setBlocks((prev) => prev.map((b) =>
      b.tempId === blockTempId
        ? { ...b, units: b.units.filter((u) => u.tempId !== unitTempId) }
        : b,
    ));

  const updUnit = (blockTempId: string, unitTempId: string, field: keyof WizardUnit, val: any) =>
    setBlocks((prev) => prev.map((b) =>
      b.tempId !== blockTempId ? b : {
        ...b,
        units: b.units.map((u) => u.tempId === unitTempId ? { ...u, [field]: val } : u),
      },
    ));

  return (
    <Box>
      {blocks.map((block) => (
        <Paper key={block.tempId} variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="subtitle1" fontWeight={700}>
              {block.name || 'Unnamed Block'}
              <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                {block.units.length} unit{block.units.length !== 1 ? 's' : ''}
              </Typography>
            </Typography>
            {!isView && (
              <Button size="small" startIcon={<AddIcon />} onClick={() => addUnit(block.tempId)}>
                Add {isPlots ? 'Plot' : 'Unit'}
              </Button>
            )}
          </Box>

          {block.units.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
              No units yet. Click "Add {isPlots ? 'Plot' : 'Unit'}" to begin.
            </Typography>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 700, whiteSpace: 'nowrap', py: 0.75 } }}>
                    <TableCell>Unit #*</TableCell>
                    <TableCell>Type</TableCell>
                    {!isPlots && <TableCell>Floor</TableCell>}
                    <TableCell>{isPlots ? 'Area (sqyd)' : 'Area (sqft)'}</TableCell>
                    <TableCell>Price (₹)</TableCell>
                    <TableCell>Facing</TableCell>
                    <TableCell>Status</TableCell>
                    {!isView && <TableCell />}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {block.units.map((unit) => (
                    <TableRow key={unit.tempId}>
                      <TableCell sx={{ minWidth: 100 }}>
                        <TextField size="small" required disabled={isView}
                          value={unit.unit_number}
                          onChange={(e) => updUnit(block.tempId, unit.tempId, 'unit_number', e.target.value)}
                          placeholder={isPlots ? 'P-01' : 'A-101'} />
                      </TableCell>
                      <TableCell sx={{ minWidth: 110 }}>
                        <Select size="small" value={unit.unit_type} displayEmpty disabled={isView}
                          onChange={(e) => updUnit(block.tempId, unit.tempId, 'unit_type', e.target.value)}
                          sx={{ minWidth: 100 }}>
                          <MenuItem value="">—</MenuItem>
                          {(choices?.unit_types ?? []).map((c: any) =>
                            <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
                        </Select>
                      </TableCell>
                      {!isPlots && (
                        <TableCell sx={{ minWidth: 80 }}>
                          <TextField size="small" type="number" disabled={isView}
                            value={unit.floor}
                            onChange={(e) => updUnit(block.tempId, unit.tempId, 'floor', e.target.value)}
                            placeholder="1" />
                        </TableCell>
                      )}
                      <TableCell sx={{ minWidth: 110 }}>
                        <TextField size="small" type="number" disabled={isView}
                          value={isPlots ? unit.area_sqyd : unit.area_sqft}
                          onChange={(e) => updUnit(block.tempId, unit.tempId,
                            isPlots ? 'area_sqyd' : 'area_sqft', e.target.value)} />
                      </TableCell>
                      <TableCell sx={{ minWidth: 120 }}>
                        <TextField size="small" type="number" disabled={isView}
                          value={unit.price}
                          onChange={(e) => updUnit(block.tempId, unit.tempId, 'price', e.target.value)} />
                      </TableCell>
                      <TableCell sx={{ minWidth: 100 }}>
                        <Select size="small" value={unit.facing} displayEmpty disabled={isView}
                          onChange={(e) => updUnit(block.tempId, unit.tempId, 'facing', e.target.value)}
                          sx={{ minWidth: 90 }}>
                          <MenuItem value="">—</MenuItem>
                          {(choices?.facings ?? []).map((c: any) =>
                            <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
                        </Select>
                      </TableCell>
                      <TableCell sx={{ minWidth: 120 }}>
                        <Select size="small" value={unit.status} disabled={isView}
                          onChange={(e) => updUnit(block.tempId, unit.tempId, 'status', e.target.value as UnitStatus)}
                          sx={{ minWidth: 110 }}>
                          {(choices?.unit_statuses ?? []).map((c: any) =>
                            <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
                        </Select>
                      </TableCell>
                      {!isView && (
                        <TableCell>
                          <IconButton size="small" color="error"
                            onClick={() => removeUnit(block.tempId, unit.tempId)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </Paper>
      ))}
    </Box>
  );
};

// ─── Step 4: Review ───────────────────────────────────────────────────────────
const StepReview: React.FC<{
  form: AvailabilityProjectFormData;
  blocks: WizardBlock[];
  isEdit: boolean;
}> = ({ form, blocks, isEdit }) => (
  <Box>
    <Alert severity={isEdit ? 'warning' : 'success'} sx={{ mb: 2, borderRadius: 2 }}>
      {isEdit
        ? 'Saving will update the project details and replace all units in each block.'
        : 'Review before saving. Blocks and units will be created in this order.'}
    </Alert>
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 2 }}>
      <Typography variant="subtitle1" fontWeight={700} gutterBottom>Project Details</Typography>
      <Grid container spacing={1.5}>
        {([
          ['Name', form.name], ['Developer', form.developer_name],
          ['Type', form.project_type], ['Status', form.status],
          ['Location', form.location], ['City', form.city],
          ['Approval', form.approval_type], ['RERA', form.rera_number],
          ['Contact', form.contact_person], ['Phone', form.contact_phone],
          ['Possession', form.possession_date],
        ] as [string, string][]).filter(([, v]) => v).map(([label, val]) => (
          <Grid key={label} size={{ xs: 6, md: 4 }}>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
            <Typography variant="body2" fontWeight={500}>{val}</Typography>
          </Grid>
        ))}
      </Grid>
    </Paper>
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
      <Typography variant="subtitle1" fontWeight={700} gutterBottom>
        {blocks.length} Block{blocks.length !== 1 ? 's' : ''} ·{' '}
        {blocks.reduce((s, b) => s + b.units.length, 0)} Total Units
      </Typography>
      {blocks.map((b, i) => (
        <Box key={b.tempId} sx={{ mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip label={`${i + 1}. ${b.name}`} size="small" color="primary" variant="outlined" />
            <Typography variant="caption" color="text.secondary">{b.units.length} units</Typography>
            {/^[0-9a-f-]{36}$/i.test(b.tempId) && (
              <Chip label="updating" size="small" color="warning" variant="outlined"
                sx={{ fontSize: '0.62rem', height: 18 }} />
            )}
          </Box>
          {b.units.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
              {b.units.slice(0, 10).map((u) => (
                <Chip key={u.tempId} label={u.unit_number || '?'} size="small" variant="outlined"
                  sx={{ fontSize: '0.68rem', height: 20 }} />
              ))}
              {b.units.length > 10 && (
                <Chip label={`+${b.units.length - 10} more`} size="small"
                  sx={{ fontSize: '0.68rem', height: 20 }} />
              )}
            </Box>
          )}
        </Box>
      ))}
    </Paper>
  </Box>
);

// ─── Main Wizard ──────────────────────────────────────────────────────────────
const ProjectForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success, error: toastError } = useToast();

  const isEdit = location.pathname.includes('/edit/');
  const isView = location.pathname.includes('/view/');
  const title = isView ? 'View Project' : isEdit ? 'Edit Project' : 'Add Project';
  usePageTitle(title);

  const [activeStep, setActiveStep] = useState(0);
  const [form, setForm] = useState<AvailabilityProjectFormData>(emptyProject);
  const [blocks, setBlocks] = useState<WizardBlock[]>([mkBlock(0)]);
  const [saving, setSaving] = useState(false);

  // Track block IDs that were removed in the UI so we can delete them on save
  const deletedBlockIds = useRef<string[]>([]);
  // Prevent re-populating form on every re-render during edit
  const populated = useRef(false);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Availability', path: '/availability/projects', icon: <ListAltIcon fontSize="small" /> },
      { label: title },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs, title]);

  // Choices dropdown
  const { data: choices } = useQuery({
    queryKey: ['avail-choices'],
    queryFn: () => availabilityApi.getChoices(),
    staleTime: 10 * 60_000,
  });

  // Load full project for edit / view
  // NOTE: getProject returns AvailabilityProjectSerializer which includes
  // blocks via AvailabilityBlockLightSerializer — NO nested units.
  // We fetch units separately per block below.
  const { data: projectData, isLoading: loadingProject } = useQuery({
    queryKey: ['avail-project-form', id],
    queryFn: () => availabilityApi.getProject(id!),
    enabled: !!(isEdit || isView) && !!id,
    staleTime: 0,          // always fresh for edit
    refetchOnMount: true,
  });

  // Load units for each block once the project is loaded
  const blockIds = projectData?.blocks?.map((b: any) => b.id) ?? [];
  const { data: allBlockUnits, isLoading: loadingUnits } = useQuery({
    queryKey: ['avail-form-block-units', ...blockIds],
    queryFn: async () => {
      const results: Record<string, any[]> = {};
      await Promise.all(
        blockIds.map(async (bid: string) => {
          results[bid] = await availabilityApi.getBlockUnits(bid);
        })
      );
      return results;
    },
    enabled: blockIds.length > 0 && !populated.current,
    staleTime: 0,
  });

  // Populate form once both project + units are loaded
  useEffect(() => {
    if (!projectData || populated.current) return;
    if (blockIds.length > 0 && !allBlockUnits) return; // wait for units

    populated.current = true;

    // Populate project details
    setForm({
      name:            projectData.name ?? '',
      developer_name:  projectData.developer_name ?? '',
      project_type:    projectData.project_type ?? 'FLATS',
      location:        projectData.location ?? '',
      city:            projectData.city ?? '',
      total_area:      projectData.total_area ?? '',
      price_range_min: projectData.price_range_min != null ? String(projectData.price_range_min) : '',
      price_range_max: projectData.price_range_max != null ? String(projectData.price_range_max) : '',
      approval_type:   projectData.approval_type ?? 'PENDING',
      approval_number: projectData.approval_number ?? '',
      status:          projectData.status ?? 'ACTIVE',
      possession_date: projectData.possession_date ?? '',
      contact_person:  projectData.contact_person ?? '',
      contact_phone:   projectData.contact_phone ?? '',
      description:     projectData.description ?? '',
      amenities:       projectData.amenities ?? '',
      rera_number:     projectData.rera_number ?? '',
      thumbnail:       null,
      brochure:        null,
      // Existing media URLs — shown as preview in edit mode
      existingThumbnailUrl: projectData.thumbnail_url ?? projectData.thumbnail ?? null,
      existingBrochureUrl:  projectData.brochure_url  ?? projectData.brochure  ?? null,
    });

    // Populate blocks with their real IDs (used as tempId for edit tracking)
    if (projectData.blocks?.length) {
      setBlocks(
        projectData.blocks.map((b: any, i: number) => {
          const fetchedUnits = allBlockUnits?.[b.id] ?? [];
          return {
            tempId:       b.id,   // real UUID — used to detect "existing" vs "new"
            name:         b.name ?? '',
            description:  b.description ?? '',
            total_floors: b.total_floors != null ? String(b.total_floors) : '',
            order:        i,
            units: fetchedUnits.map((u: any) => ({
              tempId:           u.id,   // real UUID for display only
              unit_number:      u.unit_number ?? '',
              unit_type:        u.unit_type ?? '',
              floor:            u.floor != null ? String(u.floor) : '',
              area_sqft:        u.area_sqft != null ? String(u.area_sqft) : '',
              area_sqyd:        u.area_sqyd != null ? String(u.area_sqyd) : '',
              carpet_area_sqft: u.carpet_area_sqft != null ? String(u.carpet_area_sqft) : '',
              facing:           u.facing ?? '',
              price:            u.price != null ? String(u.price) : '',
              status:           u.status ?? 'AVAILABLE',
              remarks:          u.remarks ?? '',
            })),
          };
        })
      );
    }
  }, [projectData, allBlockUnits]);

  // Validate before advancing stepper
  const canAdvance = (): boolean => {
    if (activeStep === 0) return form.name.trim().length > 0;
    if (activeStep === 1) return blocks.length > 0 && blocks.every((b) => b.name.trim().length > 0);
    return true;
  };

  // Save handler
  const handleSave = async () => {
    if (!form.name.trim()) { toastError('Project name is required'); return; }
    if (blocks.some((b) => !b.name.trim())) { toastError('All blocks must have a name'); return; }
    const badUnit = blocks.find((b) => b.units.some((u) => !u.unit_number.trim()));
    if (badUnit) { toastError(`Unit number is required in block "${badUnit.name}"`); return; }

    setSaving(true);
    try {
      // 1. Save / update the project itself
      const project = isEdit && id
        ? await availabilityApi.updateProject(id, form)
        : await availabilityApi.createProject(form);

      // 2. Delete removed blocks (edit mode only)
      if (isEdit && deletedBlockIds.current.length > 0) {
        await Promise.allSettled(
          deletedBlockIds.current.map((bid) => availabilityApi.deleteBlock(bid))
        );
        deletedBlockIds.current = [];
      }

      // 3. Create / update blocks and replace their units
      for (const wb of blocks) {
        const isExistingBlock = /^[0-9a-f-]{36}$/i.test(wb.tempId);
        const blockPayload = {
          project:      project.id,
          name:         wb.name,
          description:  wb.description || undefined,
          total_floors: wb.total_floors ? Number(wb.total_floors) : undefined,
          order:        wb.order,
        };

        let blockId: string;
        if (isEdit && isExistingBlock) {
          const updated = await availabilityApi.updateBlock(wb.tempId, blockPayload);
          blockId = updated.id;
        } else {
          const created = await availabilityApi.createBlock(blockPayload);
          blockId = created.id;
        }

        // Always replace units (bulk_create hard-deletes old ones first)
        if (wb.units.length > 0) {
          await availabilityApi.bulkCreateUnits(blockId, wb.units);
        }
      }

      // 4. Invalidate caches
      qc.invalidateQueries({ queryKey: ['avail-projects'] });
      qc.invalidateQueries({ queryKey: ['avail-project', id] });
      qc.invalidateQueries({ queryKey: ['avail-project-form', id] });

      success(isEdit ? 'Project updated successfully' : 'Project created successfully');
      navigate('/availability/projects');
    } catch (err: any) {
      const data = err?.response?.data;
      const msg = data?.name?.[0]
        ?? data?.detail
        ?? data?.error?.[0]
        ?? 'Save failed. Please check your inputs.';
      toastError(msg);
      console.error('Save error:', data);
    } finally {
      setSaving(false);
    }
  };

  const isLoadingData = loadingProject || (blockIds.length > 0 && loadingUnits && !populated.current);

  if (isLoadingData) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '60vh', gap: 2 }}>
      <CircularProgress />
      <Typography variant="body2" color="text.secondary">
        {loadingProject ? 'Loading project…' : 'Loading units…'}
      </Typography>
    </Box>
  );

  const stepContent = [
    <StepDetails form={form} setForm={setForm} choices={choices} isView={isView} />,
    <StepBlocks
      projectType={form.project_type}
      blocks={blocks}
      setBlocks={setBlocks}
      deletedBlockIds={deletedBlockIds}
      isView={isView}
    />,
    <StepUnits
      blocks={blocks}
      setBlocks={setBlocks}
      choices={choices}
      isView={isView}
      projectType={form.project_type}
    />,
    <StepReview form={form} blocks={blocks} isEdit={isEdit} />,
  ];

  return (
    <Box sx={getPageContainerStyles()}>
      <Box sx={getHeaderSectionStyles()}>
        <ScreenHeader
          title={title}
          showBackButton
          onBack={() => navigate('/availability/projects')}
          showAddButton={false}
        />
      </Box>

      <Box sx={getContentSectionStyles()}>
        {/* Stepper */}
        <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {STEPS.map((label, idx) => (
              <Step key={label} completed={idx < activeStep}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Step content */}
        <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>{STEPS[activeStep]}</Typography>
          <Divider sx={{ mb: 2.5 }} />
          {stepContent[activeStep]}
        </Paper>

        {/* Navigation */}
        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
          {activeStep > 0 && (
            <Button variant="outlined" startIcon={<ArrowBack />}
              onClick={() => setActiveStep((s) => s - 1)}>
              Back
            </Button>
          )}
          {activeStep < STEPS.length - 1 && (
            <Button variant="contained" endIcon={<ArrowForward />}
              onClick={() => setActiveStep((s) => s + 1)}
              disabled={!canAdvance()}>
              Next
            </Button>
          )}
          {activeStep === STEPS.length - 1 && !isView && (
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
              onClick={handleSave}
              disabled={saving}
            >
              {isEdit ? 'Update Project' : 'Create Project'}
            </Button>
          )}
          {isView && activeStep === STEPS.length - 1 && (
            <Button variant="outlined"
              onClick={() => navigate(`/availability/projects/edit/${id}`)}>
              Edit This Project
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ProjectForm;
