import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography,
  Box,
  CircularProgress,
  Collapse,
} from '@mui/material';
import { Close as CloseIcon, Visibility as VisibilityIcon, ExpandMore as ExpandMoreIcon, ChevronRight as ChevronRightIcon } from '@mui/icons-material';
import apiClient from '../../../api/axios.config';
import type { Distributor } from '../../../types/masters.types';

interface DistributorViewDialogProps {
  open: boolean;
  onClose: () => void;
  distributor: Distributor | null;
}

const cellLabel = { fontWeight: 600, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0', width: '25%' };
const cellValue = { border: '1px solid #e0e0e0' };
const sectionTitle = { fontWeight: 600, color: '#006766', mb: 2, mt: 3 };

// Badge colors for each hierarchy level
const levelColors: Record<string, { backgroundColor: string; color: string }> = {
  State: { backgroundColor: '#e3f2fd', color: '#1565c0' },
  District: { backgroundColor: '#fce4ec', color: '#c62828' },
  Mandal: { backgroundColor: '#fff3e0', color: '#e65100' },
  City: { backgroundColor: '#e8f5e9', color: '#2e7d32' },
  Area: { backgroundColor: '#f3e5f5', color: '#6a1b9a' },
};

interface TreeNode {
  id: string;
  name: string;
  level: string;
  children: TreeNode[];
  areas?: string[];
}

function buildLocationTree(locations: any[]): TreeNode[] {
  const stateMap = new Map<string, TreeNode>();

  for (const loc of locations) {
    if (!loc.state) continue;

    // Get or create state node
    if (!stateMap.has(loc.state)) {
      stateMap.set(loc.state, {
        id: loc.state,
        name: loc.state_name || '',
        level: 'State',
        children: [],
        areas: [],
      });
    }
    const stateNode = stateMap.get(loc.state)!;

    // If no district, no city, no area — this is a state-level entry
    if (!loc.district && !loc.city && !loc.area) continue;

    // If has district
    if (loc.district) {
      let districtNode = stateNode.children.find(d => d.id === loc.district);
      if (!districtNode) {
        districtNode = {
          id: loc.district,
          name: loc.district_name || '',
          level: 'District',
          children: [],
          areas: [],
        };
        stateNode.children.push(districtNode);
      }

      // If no mandal, no city, no area — district-level entry
      if (!loc.mandal && !loc.city && !loc.area) continue;

      // If has mandal
      if (loc.mandal) {
        let mandalNode = districtNode.children.find(m => m.id === loc.mandal);
        if (!mandalNode) {
          mandalNode = {
            id: loc.mandal,
            name: loc.mandal_name || '',
            level: 'Mandal',
            children: [],
            areas: [],
          };
          districtNode.children.push(mandalNode);
        }

        // If has city under mandal
        if (loc.city) {
          let cityNode = mandalNode.children.find(c => c.id === loc.city);
          if (!cityNode) {
            cityNode = {
              id: loc.city,
              name: loc.city_name || '',
              level: 'City',
              children: [],
              areas: [],
            };
            mandalNode.children.push(cityNode);
          }
          // If has area under city
          if (loc.area && loc.area_name && !cityNode.areas!.includes(loc.area_name)) {
            cityNode.areas!.push(loc.area_name);
          }
        }
        continue;
      }

      // District has city but no mandal
      if (loc.city) {
        let cityNode = districtNode.children.find(c => c.id === loc.city);
        if (!cityNode) {
          cityNode = {
            id: loc.city,
            name: loc.city_name || '',
            level: 'City',
            children: [],
            areas: [],
          };
          districtNode.children.push(cityNode);
        }
        if (loc.area && loc.area_name && !cityNode.areas!.includes(loc.area_name)) {
          cityNode.areas!.push(loc.area_name);
        }
      }
      continue;
    }

    // No district but has city (directly under state)
    if (loc.city) {
      let cityNode = stateNode.children.find(c => c.id === loc.city && c.level === 'City');
      if (!cityNode) {
        cityNode = {
          id: loc.city,
          name: loc.city_name || '',
          level: 'City',
          children: [],
          areas: [],
        };
        stateNode.children.push(cityNode);
      }
      if (loc.area && loc.area_name && !cityNode.areas!.includes(loc.area_name)) {
        cityNode.areas!.push(loc.area_name);
      }
    }
  }

  return Array.from(stateMap.values());
}

// Indentation per level
const levelIndent = [0, 2, 4, 6, 8];

const CollapsibleNode: React.FC<{ node: TreeNode; level: number }> = ({ node, level }) => {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = node.children.length > 0 || (node.areas && node.areas.length > 0);

  return (
    <Box sx={{ borderBottom: level === 0 ? '1px solid #e0e0e0' : 'none', '&:last-child': { borderBottom: 'none' } }}>
      {/* Node header */}
      <Box
        onClick={() => hasChildren && setExpanded(!expanded)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          pl: levelIndent[level] || 0,
          pr: 2,
          py: level === 0 ? 1.2 : 0.8,
          cursor: hasChildren ? 'pointer' : 'default',
          bgcolor: level === 0 ? '#fafafa' : 'transparent',
          borderTop: level > 0 ? '1px solid #f5f5f5' : 'none',
          '&:hover': hasChildren ? { bgcolor: level === 0 ? '#f0f0f0' : '#fafafa' } : {},
        }}
      >
        {/* Expand/collapse icon */}
        {hasChildren ? (
          expanded ? (
            <ExpandMoreIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
          ) : (
            <ChevronRightIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
          )
        ) : (
          <Box sx={{ width: 18 }} />
        )}
        <Chip
          label={node.level}
          size="small"
          sx={{ ...levelColors[node.level], fontWeight: 600, fontSize: '0.7rem', height: 22, minWidth: 55 }}
        />
        <Typography variant="body2" fontWeight={level === 0 ? 600 : 500}>
          {node.name}
        </Typography>
        {/* Show area count or children count as a hint */}
        {!expanded && hasChildren && (
          <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
            {node.children.length > 0 && `${node.children.length} ${node.children[0]?.level || 'items'}`}
            {node.children.length > 0 && node.areas && node.areas.length > 0 && ', '}
            {node.areas && node.areas.length > 0 && `${node.areas.length} areas`}
          </Typography>
        )}
      </Box>

      {/* Collapsible children */}
      {hasChildren && (
        <Collapse in={expanded}>
          <Box sx={{ pl: 1 }}>
            {/* Render child nodes */}
            {node.children.map((child) => (
              <CollapsibleNode key={child.id + child.level} node={child} level={level + 1} />
            ))}
            {/* Render areas as leaf chips */}
            {node.areas && node.areas.length > 0 && (
              <Box sx={{ pl: levelIndent[level + 1] || 0, px: 2, py: 0.8, display: 'flex', flexWrap: 'wrap', gap: 0.8, borderTop: '1px solid #f5f5f5' }}>
                {node.areas.map((area) => (
                  <Chip
                    key={area}
                    label={area}
                    size="small"
                    sx={{ ...levelColors.Area, fontSize: '0.75rem', height: 24 }}
                  />
                ))}
              </Box>
            )}
          </Box>
        </Collapse>
      )}
    </Box>
  );
};

const DistributorViewDialog: React.FC<DistributorViewDialogProps> = ({ open, onClose, distributor }) => {
  const [distributorDetail, setDistributorDetail] = useState<Distributor | null>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && distributor?.id) {
      setLoading(true);
      Promise.all([
        apiClient.get(`/api/masters/distributors/${distributor.id}/`).catch(() => ({ data: null })),
        apiClient.get(`/api/masters/distributors/${distributor.id}/attachments/`).catch(() => ({ data: [] })),
        apiClient.get(`/api/masters/distributors/${distributor.id}/contacts/`).catch(() => ({ data: [] })),
      ]).then(([detailRes, attRes, conRes]) => {
        setDistributorDetail(detailRes.data || distributor);
        setAttachments(Array.isArray(attRes.data) ? attRes.data : attRes.data?.results || []);
        setContacts(Array.isArray(conRes.data) ? conRes.data : conRes.data?.results || []);
      }).finally(() => setLoading(false));
    } else {
      setDistributorDetail(null);
      setAttachments([]);
      setContacts([]);
    }
  }, [open, distributor?.id]);

  if (!distributor) return null;

  // Use detail data if available, otherwise fall back to passed distributor
  const data = distributorDetail || distributor;

  // Build hierarchical tree from flat locations
  const rawLocations = (data as any).locations || [];
  const locationTree = buildLocationTree(rawLocations);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        View Distributor - {data.code}
        <IconButton aria-label="close" onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ py: 1 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
        ) : (
        <>
        {/* General Information */}
        <Typography variant="h6" sx={sectionTitle}>General Information</Typography>
        <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0' }}>
          <Table size="small" sx={{ borderCollapse: 'collapse' }}>
            <TableBody>
              <TableRow>
                <TableCell sx={cellLabel}>Code</TableCell>
                <TableCell sx={cellValue}>{data.code}</TableCell>
                <TableCell sx={cellLabel}>Name</TableCell>
                <TableCell sx={cellValue}>{data.name}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>Company</TableCell>
                <TableCell sx={cellValue}>{data.company_name || '-'}</TableCell>
                <TableCell sx={cellLabel}>Superstockist</TableCell>
                <TableCell sx={cellValue}>{data.superstockist_name || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>Agent</TableCell>
                <TableCell sx={cellValue}>{(data as any).agent_name || '-'}</TableCell>
                <TableCell sx={cellLabel}>State</TableCell>
                <TableCell sx={cellValue}>{data.state_name || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>City</TableCell>
                <TableCell sx={cellValue}>{data.city_name || '-'}</TableCell>
                <TableCell sx={cellValue}>{data.area_name || '-'}</TableCell>
                <TableCell sx={cellLabel}>Pincode</TableCell>
                <TableCell sx={cellValue}>{data.pincode || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>Address</TableCell>
                <TableCell colSpan={3} sx={cellValue}>{data.address || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>GSTIN</TableCell>
                <TableCell sx={cellValue}>{data.gstin || '-'}</TableCell>
                <TableCell sx={cellLabel}>PAN</TableCell>
                <TableCell sx={cellValue}>{data.pan || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>Aadhar</TableCell>
                <TableCell sx={cellValue}>{data.aadhar || '-'}</TableCell>
                <TableCell sx={cellLabel}>Google Location</TableCell>
                <TableCell sx={cellValue}>{data.google_location || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>Credit Limit</TableCell>
                <TableCell sx={cellValue}>{data.credit_limit || '-'}</TableCell>
                <TableCell sx={cellLabel}>Credit Days</TableCell>
                <TableCell sx={cellValue}>{data.credit_days ?? '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>Effective From</TableCell>
                <TableCell sx={cellValue}>{data.effective_from || '-'}</TableCell>
                <TableCell sx={cellLabel}>Effective To</TableCell>
                <TableCell sx={cellValue}>{data.effective_to || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>ERP Code</TableCell>
                <TableCell sx={cellValue}>{data.erp_code || '-'}</TableCell>
                <TableCell sx={cellLabel}>Status</TableCell>
                <TableCell sx={cellValue}>
                  <Chip label={data.is_active ? 'Active' : 'Inactive'} color={data.is_active ? 'success' : 'default'} size="small" />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {/* Shipping Address */}
        <Typography variant="h6" sx={sectionTitle}>Shipping Address</Typography>
        <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0' }}>
          <Table size="small" sx={{ borderCollapse: 'collapse' }}>
            <TableBody>
              <TableRow>
                <TableCell sx={cellLabel}>Same as Billing</TableCell>
                <TableCell sx={cellValue}>{data.shipping_same_as_billing ? 'Yes' : 'No'}</TableCell>
                <TableCell sx={cellLabel}>State</TableCell>
                <TableCell sx={cellValue}>{data.shipping_state_name || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>City</TableCell>
                <TableCell sx={cellValue}>{data.shipping_city_name || '-'}</TableCell>
                <TableCell sx={cellLabel}>Area</TableCell>
                <TableCell sx={cellValue}>{data.shipping_area_name || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>Address</TableCell>
                <TableCell sx={cellValue}>{data.shipping_address || '-'}</TableCell>
                <TableCell sx={cellLabel}>Pincode</TableCell>
                <TableCell sx={cellValue}>{data.shipping_pincode || '-'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {/* Bank Details */}
        <Typography variant="h6" sx={sectionTitle}>Bank Details</Typography>
        <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0' }}>
          <Table size="small" sx={{ borderCollapse: 'collapse' }}>
            <TableBody>
              <TableRow>
                <TableCell sx={cellLabel}>Bank Name</TableCell>
                <TableCell sx={cellValue}>{data.bank_name || '-'}</TableCell>
                <TableCell sx={cellLabel}>Branch</TableCell>
                <TableCell sx={cellValue}>{data.bank_branch || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>Account Number</TableCell>
                <TableCell sx={cellValue}>{data.bank_account_number || '-'}</TableCell>
                <TableCell sx={cellLabel}>IFSC</TableCell>
                <TableCell sx={cellValue}>{data.bank_ifsc || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>Account Type</TableCell>
                <TableCell colSpan={3} sx={cellValue}>{data.bank_account_type || '-'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {/* Coverage Areas */}
        <Typography variant="h6" sx={sectionTitle}>Coverage Areas</Typography>
        {locationTree.length > 0 ? (
          <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, overflow: 'hidden' }}>
            {locationTree.map((stateNode) => (
              <CollapsibleNode key={stateNode.id} node={stateNode} level={0} />
            ))}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">No coverage areas defined</Typography>
        )}

        {/* Contacts */}
        {contacts.length > 0 && (
          <>
            <Typography variant="h6" sx={sectionTitle}>Contacts ({contacts.length})</Typography>
            <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0' }}>
              <Table size="small" sx={{ borderCollapse: 'collapse' }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#006766' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>S.No</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>Name</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>Phone</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>Email</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600, border: '1px solid #e0e0e0' }}>Designation</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {contacts.map((c: any, i: number) => (
                    <TableRow key={c.id || i}>
                      <TableCell sx={cellValue}>{i + 1}</TableCell>
                      <TableCell sx={cellValue}>{c.contact_person || c.name || '-'}</TableCell>
                      <TableCell sx={cellValue}>{c.phone || '-'}</TableCell>
                      <TableCell sx={cellValue}>{c.email || '-'}</TableCell>
                      <TableCell sx={cellValue}>{c.designation || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        {/* Attachments */}
        {!loading && attachments.length > 0 && (
          <>
            <Typography variant="h6" sx={sectionTitle}>Attachments ({attachments.length})</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {attachments.map((att: any, i: number) => (
                <Paper key={att.id || i} sx={{ p: 2, minWidth: 200, border: '1px solid #e0e0e0' }}>
                  <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                    {att.attachment_type_display || att.attachment_type || 'Attachment'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    {att.original_filename || att.file?.split('/').pop() || 'File'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {att.file_url && (
                      <Button size="small" variant="outlined" startIcon={<VisibilityIcon />} href={att.file_url} target="_blank">
                        View
                      </Button>
                    )}
                  </Box>
                </Paper>
              ))}
            </Box>
          </>
        )}

        {/* Audit Info */}
        <Typography variant="h6" sx={sectionTitle}>Audit Information</Typography>
        <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0' }}>
          <Table size="small" sx={{ borderCollapse: 'collapse' }}>
            <TableBody>
              <TableRow>
                <TableCell sx={cellLabel}>Created By</TableCell>
                <TableCell sx={cellValue}>{(data as any).created_by_name || '-'}</TableCell>
                <TableCell sx={cellLabel}>Created On</TableCell>
                <TableCell sx={cellValue}>{data.created_on ? new Date(data.created_on).toLocaleString('en-GB') : '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={cellLabel}>Updated By</TableCell>
                <TableCell sx={cellValue}>{(data as any).updated_by_name || '-'}</TableCell>
                <TableCell sx={cellLabel}>Updated On</TableCell>
                <TableCell sx={cellValue}>{(data as any).updated_on ? new Date((data as any).updated_on).toLocaleString('en-GB') : '-'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
        </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="contained">Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DistributorViewDialog;
