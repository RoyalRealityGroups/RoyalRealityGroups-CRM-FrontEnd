import { API_BASE_URL } from './constants';

const ABSOLUTE_URL_REGEX = /^(?:[a-z]+:)?\/\//i;

const isAbsoluteLike = (value: string): boolean =>
  ABSOLUTE_URL_REGEX.test(value) || value.startsWith('data:') || value.startsWith('blob:');

const getRelativeCandidates = (trimmed: string): string[] => {
  if (!trimmed) return [];

  if (trimmed.startsWith('/media/')) {
    return [trimmed];
  }

  if (trimmed.startsWith('media/')) {
    return [`/${trimmed}`];
  }

  if (trimmed.startsWith('/')) {
    return [trimmed, `/media${trimmed}`];
  }

  return [`/media/${trimmed}`, `/${trimmed}`];
};

export const getMediaUrlCandidates = (url?: string | null): string[] => {
  if (!url) return [];

  const trimmed = url.trim();
  if (!trimmed) return [];

  if (isAbsoluteLike(trimmed)) {
    return [trimmed];
  }

  const candidates: string[] = [];
  const addCandidate = (candidate?: string) => {
    if (candidate && !candidates.includes(candidate)) {
      candidates.push(candidate);
    }
  };

  const relativeCandidates = getRelativeCandidates(trimmed);
  relativeCandidates.forEach((path) => {
    if (typeof window !== 'undefined') {
      addCandidate(new URL(path, window.location.origin).toString());
    }
    addCandidate(new URL(path, API_BASE_URL).toString());
    addCandidate(path);
  });

  return candidates;
};

export const resolveMediaUrl = (url?: string | null): string => {
  if (!url) return '';

  const trimmed = url.trim();
  if (!trimmed) return '';

  if (isAbsoluteLike(trimmed)) {
    return trimmed;
  }

  const relativeCandidates = getRelativeCandidates(trimmed);
  if (relativeCandidates.length === 0) {
    return '';
  }

  return new URL(relativeCandidates[0], API_BASE_URL).toString();
};
