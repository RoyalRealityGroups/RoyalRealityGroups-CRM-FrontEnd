import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Paper, Grid, Typography, Button, TextField, MenuItem,
  Divider, Slider, CircularProgress, Chip, Alert, Stack,
} from '@mui/material';
import {
  Save as SaveIcon, RestartAlt as ResetIcon, Palette as PaletteIcon,
  Visibility as PreviewIcon, Check as CheckIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useThemeSettings } from '../../contexts/ThemeSettingsContext';
import { AVAILABLE_FONTS, type ThemeTokens } from '../../theme/themeTokens';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks';
import ScreenHeader from '../../components/common/ScreenHeader';
import { getPageContainerStyles, getHeaderSectionStyles, getContentSectionStyles } from '../../utils/spacing';
import HomeIcon from '@mui/icons-material/Home';
import SettingsIcon from '@mui/icons-material/Settings';

// ── a single color field: swatch + native picker + hex text ──────────────────
const ColorField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
}> = ({ label, value, onChange }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 0.5, display: 'block' }}>
      {label}
    </Typography>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box
        component="label"
        sx={{
          width: 40, height: 40, borderRadius: 1.5, border: '2px solid',
          borderColor: 'divider', cursor: 'pointer', position: 'relative',
          backgroundColor: value, flexShrink: 0, overflow: 'hidden',
        }}
      >
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          style={{ opacity: 0, width: '100%', height: '100%', cursor: 'pointer', border: 'none' }}
        />
      </Box>
      <TextField
        size="small"
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        sx={{ width: 120, '& input': { fontFamily: 'monospace', fontSize: '0.8rem' } }}
        inputProps={{ maxLength: 9 }}
      />
    </Box>
  </Box>
);

const COLOR_FIELDS: { key: keyof ThemeTokens; label: string }[] = [
  { key: 'primary_color', label: 'Primary' },
  { key: 'secondary_color', label: 'Secondary / Accent' },
  { key: 'background_color', label: 'Background' },
  { key: 'paper_color', label: 'Surface / Cards' },
  { key: 'text_primary_color', label: 'Primary Text' },
  { key: 'text_secondary_color', label: 'Secondary Text' },
];

const SEMANTIC_FIELDS: { key: keyof ThemeTokens; label: string }[] = [
  { key: 'success_color', label: 'Success' },
  { key: 'error_color', label: 'Error' },
  { key: 'warning_color', label: 'Warning' },
  { key: 'info_color', label: 'Info' },
];

const AppearanceSettings: React.FC = () => {
  const navigate = useNavigate();
  const { tokens, isLoading, setPreview, save, reset } = useThemeSettings();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { success, error: toastError } = useToast();
  usePageTitle('Appearance');

  const [draft, setDraft] = useState<ThemeTokens>(tokens);
  const [saving, setSaving] = useState(false);
  const [previewOn, setPreviewOn] = useState(false);

  // Sync draft when saved tokens load/change
  useEffect(() => { setDraft(tokens); }, [tokens]);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
      { label: 'Settings', path: '/settings', icon: <SettingsIcon fontSize="small" /> },
      { label: 'Appearance' },
    ]);
    return () => { setBreadcrumbs([]); setPreview(null); };
  }, [setBreadcrumbs, setPreview]);

  // Live preview: push the draft to the theme whenever previewOn + draft changes
  useEffect(() => {
    if (previewOn) setPreview(draft);
    else setPreview(null);
  }, [previewOn, draft, setPreview]);

  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(tokens),
    [draft, tokens],
  );

  const upd = (key: keyof ThemeTokens, value: any) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await save(draft);
      setPreviewOn(false);
      success('Appearance updated — applied across the app');
    } catch (err: any) {
      const data = err?.response?.data;
      const firstKey = data && typeof data === 'object' ? Object.keys(data)[0] : null;
      const msg = firstKey ? `${firstKey}: ${data[firstKey]}` : (data?.detail || 'Failed to save appearance');
      toastError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    try {
      const defaults = await reset();
      setDraft(defaults);
      setPreviewOn(false);
      success('Appearance reset to defaults');
    } catch {
      toastError('Failed to reset appearance');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={getPageContainerStyles()}>
      <Box sx={getHeaderSectionStyles()}>
        <ScreenHeader
          title="Appearance"
          subtitle="Customize colors and fonts for the whole application"
          showBackButton
          onBack={() => navigate('/settings')}
          showAddButton={false}
        />
      </Box>

      <Box sx={getContentSectionStyles()}>
        <Grid container spacing={2.5}>
          {/* ── Left: configuration ──────────────────────────────────── */}
          <Grid size={{ xs: 12, md: 7 }}>
            {/* Brand colors */}
            <Paper variant="outlined" sx={{ p: 2.5, mb: 2.5, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <PaletteIcon color="primary" fontSize="small" />
                <Typography variant="subtitle1" fontWeight={700}>Brand Colors</Typography>
              </Box>
              <Grid container spacing={2.5}>
                {COLOR_FIELDS.map((f) => (
                  <Grid key={f.key} size={{ xs: 6, sm: 4 }}>
                    <ColorField label={f.label} value={String(draft[f.key])} onChange={(v) => upd(f.key, v)} />
                  </Grid>
                ))}
              </Grid>
            </Paper>

            {/* Semantic colors */}
            <Paper variant="outlined" sx={{ p: 2.5, mb: 2.5, borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Status Colors</Typography>
              <Grid container spacing={2.5}>
                {SEMANTIC_FIELDS.map((f) => (
                  <Grid key={f.key} size={{ xs: 6, sm: 3 }}>
                    <ColorField label={f.label} value={String(draft[f.key])} onChange={(v) => upd(f.key, v)} />
                  </Grid>
                ))}
              </Grid>
            </Paper>

            {/* Typography + shape */}
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Typography & Shape</Typography>
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    select fullWidth size="small" label="Heading Font"
                    value={draft.heading_font}
                    onChange={(e) => upd('heading_font', e.target.value)}
                  >
                    {AVAILABLE_FONTS.map((f) => (
                      <MenuItem key={f} value={f} style={{ fontFamily: `"${f}", sans-serif` }}>{f}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    select fullWidth size="small" label="Body Font"
                    value={draft.body_font}
                    onChange={(e) => upd('body_font', e.target.value)}
                  >
                    {AVAILABLE_FONTS.map((f) => (
                      <MenuItem key={f} value={f} style={{ fontFamily: `"${f}", sans-serif` }}>{f}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Corner Radius — {draft.border_radius}px
                  </Typography>
                  <Slider
                    value={draft.border_radius}
                    min={0} max={24} step={1}
                    marks={[{ value: 0, label: 'Square' }, { value: 10, label: 'Default' }, { value: 24, label: 'Round' }]}
                    onChange={(_, v) => upd('border_radius', v as number)}
                    sx={{ mt: 1 }}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* ── Right: live preview ──────────────────────────────────── */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, position: 'sticky', top: 8 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={700}>Preview</Typography>
                <Button
                  size="small"
                  variant={previewOn ? 'contained' : 'outlined'}
                  startIcon={previewOn ? <CheckIcon /> : <PreviewIcon />}
                  onClick={() => setPreviewOn((v) => !v)}
                >
                  {previewOn ? 'Live preview on' : 'Preview live'}
                </Button>
              </Box>

              {/* Mini mock built from the DRAFT tokens directly (always reflects draft) */}
              <Box sx={{
                borderRadius: `${draft.border_radius}px`,
                border: `1px solid ${draft.text_primary_color}14`,
                overflow: 'hidden',
              }}>
                {/* app bar */}
                <Box sx={{ p: 1.5, backgroundColor: draft.paper_color, borderBottom: `1px solid ${draft.text_primary_color}14`, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 24, height: 24, borderRadius: 1, backgroundColor: draft.primary_color }} />
                  <Typography sx={{ fontFamily: `"${draft.heading_font}", sans-serif`, fontWeight: 700, fontSize: '0.9rem', color: draft.text_primary_color }}>
                    Royal Reality Groups
                  </Typography>
                </Box>
                {/* body */}
                <Box sx={{ p: 2, backgroundColor: draft.background_color }}>
                  <Typography sx={{ fontFamily: `"${draft.heading_font}", sans-serif`, fontWeight: 700, color: draft.text_primary_color, mb: 0.5 }}>
                    Dashboard
                  </Typography>
                  <Typography sx={{ fontFamily: `"${draft.body_font}", sans-serif`, fontSize: '0.8rem', color: draft.text_secondary_color, mb: 1.5 }}>
                    Preview of your theme across cards, buttons and chips.
                  </Typography>
                  {/* card */}
                  <Box sx={{ p: 1.5, borderRadius: `${draft.border_radius}px`, backgroundColor: draft.paper_color, border: `1px solid ${draft.text_primary_color}14`, mb: 1.5 }}>
                    <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
                      <Chip label="Primary" size="small" sx={{ backgroundColor: `${draft.primary_color}18`, color: draft.primary_color, fontWeight: 600 }} />
                      <Chip label="Success" size="small" sx={{ backgroundColor: `${draft.success_color}18`, color: draft.success_color, fontWeight: 600 }} />
                      <Chip label="Error" size="small" sx={{ backgroundColor: `${draft.error_color}18`, color: draft.error_color, fontWeight: 600 }} />
                      <Chip label="Warning" size="small" sx={{ backgroundColor: `${draft.warning_color}18`, color: draft.warning_color, fontWeight: 600 }} />
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <Box sx={{
                        px: 1.5, py: 0.75, borderRadius: `${Math.max(6, draft.border_radius - 2)}px`,
                        backgroundColor: draft.primary_color, color: '#fff',
                        fontSize: '0.75rem', fontWeight: 600, fontFamily: `"${draft.body_font}", sans-serif`,
                      }}>
                        Primary
                      </Box>
                      <Box sx={{
                        px: 1.5, py: 0.75, borderRadius: `${Math.max(6, draft.border_radius - 2)}px`,
                        backgroundColor: draft.secondary_color, color: '#fff',
                        fontSize: '0.75rem', fontWeight: 600, fontFamily: `"${draft.body_font}", sans-serif`,
                      }}>
                        Secondary
                      </Box>
                      <Box sx={{
                        px: 1.5, py: 0.75, borderRadius: `${Math.max(6, draft.border_radius - 2)}px`,
                        border: `1px solid ${draft.text_primary_color}22`, color: draft.text_primary_color,
                        fontSize: '0.75rem', fontWeight: 600, fontFamily: `"${draft.body_font}", sans-serif`,
                      }}>
                        Outlined
                      </Box>
                    </Stack>
                  </Box>
                </Box>
              </Box>

              {previewOn && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Live preview is applied to the whole app. Save to keep it, or turn off preview to revert.
                </Alert>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* ── Action bar ─────────────────────────────────────────────── */}
        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', mt: 3, flexWrap: 'wrap' }}>
          <Button
            variant="outlined" color="error" startIcon={<ResetIcon />}
            onClick={handleReset} disabled={saving}
          >
            Reset to Defaults
          </Button>
          <Button
            variant="outlined"
            onClick={() => { setDraft(tokens); setPreviewOn(false); }}
            disabled={saving || !dirty}
          >
            Discard Changes
          </Button>
          <Button
            variant="contained" startIcon={<SaveIcon />}
            onClick={handleSave} disabled={saving || !dirty}
          >
            {saving ? 'Saving…' : 'Save & Apply'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default AppearanceSettings;
