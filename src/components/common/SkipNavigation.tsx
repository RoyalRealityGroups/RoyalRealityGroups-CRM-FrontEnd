import { Box, Link } from '@mui/material';

export const SkipNavigation = () => {
  return (
    <Box
      sx={{
        position: 'absolute',
        left: '-9999px',
        zIndex: 9999,
        '&:focus': {
          left: '50%',
          top: 0,
          transform: 'translateX(-50%)',
          backgroundColor: 'primary.main',
          color: 'primary.contrastText',
          padding: 2,
          borderRadius: 1,
          textDecoration: 'none',
        },
      }}
    >
      <Link
        href="#main-content"
        sx={{
          color: 'inherit',
          textDecoration: 'none',
          '&:focus': {
            outline: '2px solid',
            outlineColor: 'primary.contrastText',
            outlineOffset: 2,
          },
        }}
      >
        Skip to main content
      </Link>
    </Box>
  );
};
