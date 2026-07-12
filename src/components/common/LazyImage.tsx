import React, { useState, useEffect } from 'react';
import { Box, Skeleton } from '@mui/material';

interface LazyImageProps {
  src: string;
  alt: string;
  placeholder?: string;
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
}

/**
 * LazyImage Component
 * 
 * Lazy loads images with skeleton placeholder.
 * Improves initial page load performance.
 * 
 * @example
 * ```tsx
 * <LazyImage
 *   src={item.image_url}
 *   alt={item.name}
 *   width={200}
 *   height={200}
 * />
 * ```
 */
const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  width = '100%',
  height = 'auto',
  style,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => setLoaded(true);
    img.onerror = () => setError(true);
    
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  if (error) {
    return (
      <Box
        sx={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          border: '1px solid #e0e0e0',
          borderRadius: 1,
          ...style,
        }}
      >
        <span style={{ color: '#999' }}>Image not available</span>
      </Box>
    );
  }

  if (!loaded) {
    return (
      <Skeleton
        variant="rectangular"
        width={width}
        height={height}
        animation="wave"
        sx={style}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      style={{ width, height, objectFit: 'cover', ...style }}
      loading="lazy"
    />
  );
};

export default LazyImage;
