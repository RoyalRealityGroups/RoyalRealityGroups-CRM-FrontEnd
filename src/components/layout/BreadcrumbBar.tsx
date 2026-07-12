import React from 'react';
import { Box, Breadcrumbs, Link, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';

const BreadcrumbBar: React.FC = () => {
  const navigate = useNavigate();
  const { breadcrumbs } = useBreadcrumbs();

  // Don't render if no breadcrumbs
  if (!breadcrumbs || breadcrumbs.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 1200,
        bgcolor: '#fff',
        px: { xs: 0.75, sm: 1, md: 1.5 },
        py: { xs: 0.5, sm: 0.75 },
        boxShadow: 1,
        borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
      }}
    >
      <Box sx={{ maxWidth: 'xl', margin: '0 auto' }}>
        <Breadcrumbs aria-label="breadcrumb">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;

            if (isLast) {
              return (
                <Typography
                  key={index}
                  component="div"
                  color="text.primary"
                  sx={{ display: 'flex', alignItems: 'center' }}
                >
                  {crumb.icon && <Box sx={{ mr: 0.5, display: 'flex' }}>{crumb.icon}</Box>}
                  {crumb.label}
                </Typography>
              );
            }

            return (
              <Link
                key={index}
                underline="hover"
                color="inherit"
                onClick={() => crumb.path && navigate(crumb.path)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: crumb.path ? 'pointer' : 'default',
                }}
              >
                {crumb.icon && <Box sx={{ mr: 0.5, display: 'flex' }}>{crumb.icon}</Box>}
                {crumb.label}
              </Link>
            );
          })}
        </Breadcrumbs>
      </Box>
    </Box>
  );
};

export default BreadcrumbBar;
