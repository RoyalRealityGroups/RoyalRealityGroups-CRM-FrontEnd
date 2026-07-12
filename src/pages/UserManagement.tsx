import { useState, useEffect } from 'react';
import { 
  Box, Card, Table, Button, TextField, MenuItem, 
  IconButton, Chip, Typography, Dialog, DialogTitle, 
  DialogContent, DialogActions, Grid, Select, FormControl, InputLabel
} from '@mui/material';
import { Add, Edit, Delete, Person, Email, Phone } from '@mui/icons-material';
import { useAppSelector } from '../store/hooks';
import { userApi } from '../api/users.api';

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  is_active: boolean;
  groups: { id: number; name: string }[];
}

interface Group {
  id: number;
  name: string;
}

export default function UserManagement() {
  const permissions = useAppSelector((state) => state.permissions.permissions);
  // Permissions are stored as strings like "User & Permission Management_view"
  const canView = permissions.some((p: string) => p === 'User & Permission Management_view');
  const canEdit = permissions.some((p: string) => p === 'User & Permission Management_edit');
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: '', password: '', first_name: '', last_name: '',
    email: '', phone: '', group_ids: [] as number[], is_active: true
  });

  useEffect(() => {
    fetchUsers();
    fetchGroups();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await userApi.getUsers();
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await userApi.getGroups();
      setGroups(res.data);
    } catch (err) {
      console.error('Failed to fetch groups', err);
    }
  };

  const handleSubmit = async () => {
    try {
      await userApi.createUser(formData);
      setOpen(false);
      fetchUsers();
      setFormData({ username: '', password: '', first_name: '', last_name: '', email: '', phone: '', group_ids: [], is_active: true });
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create user');
    }
  };

  if (!canView) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5" color="error">Access Denied</Typography>
        <Typography>You don't have permission to view users.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">User Management</Typography>
        {canEdit && (
          <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>
            Add User
          </Button>
        )}
      </Box>

      <Card>
        <Table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Groups</th>
              <th>Status</th>
              {canEdit && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>{user.first_name} {user.last_name}</td>
                <td>{user.email || '-'}</td>
                <td>{user.phone || '-'}</td>
                <td>
                  {user.groups?.map(g => (
                    <Chip key={g.id} label={g.name} size="small" sx={{ mr: 0.5 }} />
                  ))}
                </td>
                <td>
                  <Chip label={user.is_active ? 'Active' : 'Inactive'} 
                    color={user.is_active ? 'success' : 'default'} size="small" />
                </td>
{canEdit && (
                  <td>
                    <IconButton size="small"><Edit /></IconButton>
                    <IconButton size="small" color="error"><Delete /></IconButton>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label="Username *" value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label="Password *" type="password" value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label="First Name" value={formData.first_name}
                onChange={e => setFormData({...formData, first_name: e.target.value})} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label="Last Name" value={formData.last_name}
                onChange={e => setFormData({...formData, last_name: e.target.value})} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label="Email" type="email" value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label="Phone" value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>Groups *</InputLabel>
                <Select multiple value={formData.group_ids}
                  onChange={e => setFormData({...formData, group_ids: e.target.value as number[]})}
                  renderValue={(selected) => selected.map(id => 
                    groups.find(g => g.id === id)?.name).join(', ')}>
                  {groups.map(group => (
                    <MenuItem key={group.id} value={group.id}>{group.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
