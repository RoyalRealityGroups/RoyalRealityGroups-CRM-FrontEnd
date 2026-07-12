import React, { useEffect, useMemo, useState } from 'react';
import { Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { getMediaUrlCandidates } from '../../utils/media';

interface MediaImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  sx?: SxProps<Theme>;
}

const MediaImage: React.FC<MediaImageProps> = ({ src, alt = 'image', sx, onError, ...imgProps }) => {
  const normalizedSource = src?.trim() || '';
  const candidateSources = useMemo(
    () => getMediaUrlCandidates(normalizedSource),
    [normalizedSource]
  );
  const [activeCandidateIndex, setActiveCandidateIndex] = useState(0);

  useEffect(() => {
    setActiveCandidateIndex(0);
  }, [normalizedSource]);

  if (!normalizedSource || candidateSources.length === 0) {
    return null;
  }

  const imageSource = candidateSources[Math.min(activeCandidateIndex, candidateSources.length - 1)];

  const handleError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const hasFallback = activeCandidateIndex < candidateSources.length - 1;
    if (hasFallback) {
      setActiveCandidateIndex((prev) => prev + 1);
      return;
    }

    if (onError) {
      onError(event);
    }

  };

  return (
    <Box
      component="img"
      src={imageSource}
      alt={alt}
      onError={handleError}
      sx={sx}
      {...imgProps}
    />
  );
};

export default MediaImage;
