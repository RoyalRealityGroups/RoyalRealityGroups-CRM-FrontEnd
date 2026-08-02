import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { Box, Typography } from '@mui/material';
import type { MenuItem, Submenu, MenuItemDetail } from '../../types/menu.types';

/**
 * Redirects to the first screen the user has access to, based on their menu.
 * If no menu items exist yet (loading), renders nothing.
 * If truly no menu items, shows a contact-admin message.
 */
const SmartRedirect: React.FC = () => {
  const menus: MenuItem[] = useSelector((state: RootState) => state.menu.menus);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const firstLink = findFirstLink(menus);

  if (firstLink) {
    return <Navigate to={firstLink} replace />;
  }

  // Menu not loaded yet — wait silently
  if (menus.length === 0) return null;

  // Loaded but genuinely empty — no screens assigned
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <Typography variant="h6" color="text.secondary">
        No screens assigned to your account. Please contact your administrator.
      </Typography>
    </Box>
  );
};

function findFirstLink(menus: MenuItem[]): string | null {
  const sorted = [...menus].sort((a, b) => a.sequence - b.sequence);

  for (const menu of sorted) {
    const submenus: Submenu[] = [
      ...(menu.submenus || []),
      ...(menu.submenu ? [menu.submenu as unknown as Submenu] : []),
    ].sort((a, b) => a.sequence - b.sequence);

    for (const sub of submenus) {
      const items: MenuItemDetail[] = [...(sub.menuitems || [])].sort(
        (a, b) => a.sequence - b.sequence
      );
      for (const item of items) {
        const link = item.link || item.path;
        if (link) return link;
      }
    }
  }

  return null;
}

export default SmartRedirect;
