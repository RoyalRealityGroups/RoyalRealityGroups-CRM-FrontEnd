import React, { useEffect, useMemo, useState } from 'react';
import { resolveMediaUrl } from '../../utils/media';

interface SvgIconProps {
  src?: string;
  alt?: string;
  size?: number;
  style?: React.CSSProperties;
  parentHover?: boolean;
}

const SvgIcon: React.FC<SvgIconProps> = ({
  src,
  alt = 'icon',
  size = 24,
  style,
  parentHover = false,
}) => {
  if (!src) {
    return null;
  }

  const normalizedSource = src.trim();
  const candidateSources = useMemo(() => {
    if (!normalizedSource) {
      return [] as string[];
    }

    const candidates: string[] = [];
    const addCandidate = (candidate?: string) => {
      if (candidate && !candidates.includes(candidate)) {
        candidates.push(candidate);
      }
    };

    const isAbsolute =
      /^(?:[a-z]+:)?\/\//i.test(normalizedSource) ||
      normalizedSource.startsWith('data:') ||
      normalizedSource.startsWith('blob:');

    const toRootPath = (value: string) => (value.startsWith('/') ? value : `/${value}`);
    const mediaPath = normalizedSource.includes('/')
      ? toRootPath(normalizedSource)
      : `/media/web_icons/${normalizedSource}`;

    if (isAbsolute) {
      addCandidate(normalizedSource);
      return candidates;
    }

    if (typeof window !== 'undefined') {
      addCandidate(new URL(mediaPath, window.location.origin).toString());
    }
    addCandidate(resolveMediaUrl(mediaPath));
    addCandidate(mediaPath);

    return candidates;
  }, [normalizedSource]);

  const [activeCandidateIndex, setActiveCandidateIndex] = useState(0);

  useEffect(() => {
    setActiveCandidateIndex(0);
  }, [normalizedSource]);

  if (candidateSources.length === 0) {
    return null;
  }

  const iconPath = candidateSources[Math.min(activeCandidateIndex, candidateSources.length - 1)];

  return (
    <img
      src={iconPath}
      alt={alt}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        display: 'block',
        objectFit: 'contain',
        ...style,
      }}
      onError={(e) => {
        const hasFallback = activeCandidateIndex < candidateSources.length - 1;
        if (hasFallback) {
          setActiveCandidateIndex((prev) => prev + 1);
          return;
        }
      }}
    />
  );
};

export default SvgIcon;
