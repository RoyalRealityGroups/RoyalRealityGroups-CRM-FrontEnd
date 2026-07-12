import { Skeleton, Box, Stack } from '@mui/material';

interface LoadingSkeletonProps {
  variant?: 'table' | 'card' | 'form' | 'text';
  rows?: number;
}

export const LoadingSkeleton = ({ variant = 'table', rows = 5 }: LoadingSkeletonProps) => {
  if (variant === 'table') {
    return (
      <Box>
        <Skeleton variant="rectangular" height={56} sx={{ mb: 2 }} />
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={48} sx={{ mb: 1 }} />
        ))}
      </Box>
    );
  }

  if (variant === 'card') {
    return (
      <Stack spacing={2}>
        {Array.from({ length: rows }).map((_, i) => (
          <Box key={i} sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
            <Skeleton variant="text" width="60%" height={24} />
            <Skeleton variant="text" width="40%" height={20} sx={{ mt: 1 }} />
            <Skeleton variant="rectangular" height={100} sx={{ mt: 2 }} />
          </Box>
        ))}
      </Stack>
    );
  }

  if (variant === 'form') {
    return (
      <Stack spacing={3}>
        {Array.from({ length: rows }).map((_, i) => (
          <Box key={i}>
            <Skeleton variant="text" width="30%" height={20} sx={{ mb: 1 }} />
            <Skeleton variant="rectangular" height={56} />
          </Box>
        ))}
      </Stack>
    );
  }

  return (
    <Stack spacing={1}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} variant="text" height={24} />
      ))}
    </Stack>
  );
};
