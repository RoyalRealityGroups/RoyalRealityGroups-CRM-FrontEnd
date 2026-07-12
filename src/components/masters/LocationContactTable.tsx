import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Typography,
  Box,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

interface LocationContact {
  id: string;
  contact_person: string;
  phone: string;
  email: string;
  designation: string;
  is_primary: boolean;
}

interface LocationContactTableProps {
  contacts: LocationContact[];
  onEdit: (contact: LocationContact) => void;
  onDelete: (contactId: string) => void;
  isLoading?: boolean;
}

const LocationContactTable: React.FC<LocationContactTableProps> = ({
  contacts = [],
  onEdit,
  onDelete,
  isLoading = false,
}) => {
  const safeContacts = Array.isArray(contacts) ? contacts : [];

  if (safeContacts.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          No contacts added yet. Click "Add Contact" to add one.
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: 'grey.50' }}>
            <TableCell sx={{ fontWeight: 600 }}>Contact Person</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Designation</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Primary</TableCell>
            <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {safeContacts.map((contact) => (
            <TableRow key={contact.id} hover>
              <TableCell>{contact.contact_person}</TableCell>
              <TableCell>{contact.phone || '-'}</TableCell>
              <TableCell>{contact.email || '-'}</TableCell>
              <TableCell>{contact.designation || '-'}</TableCell>
              <TableCell>
                {contact.is_primary && (
                  <Chip label="Primary" size="small" color="primary" />
                )}
              </TableCell>
              <TableCell align="center">
                <IconButton
                  size="small"
                  onClick={() => onEdit(contact)}
                  disabled={isLoading}
                  color="primary"
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => onDelete(contact.id)}
                  disabled={isLoading}
                  color="error"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default LocationContactTable;
export { type LocationContact };
