import { useCallback, useMemo } from 'react';

/**
 * Custom hooks for performance optimization
 */

/**
 * Memoized filter function
 */
export const useFilteredData = <T,>(
  data: T[],
  filterFn: (item: T) => boolean
) => {
  return useMemo(() => data.filter(filterFn), [data, filterFn]);
};

/**
 * Memoized sort function
 */
export const useSortedData = <T,>(
  data: T[],
  sortFn: (a: T, b: T) => number
) => {
  return useMemo(() => [...data].sort(sortFn), [data, sortFn]);
};

/**
 * Memoized search function
 */
export const useSearchedData = <T,>(
  data: T[],
  searchTerm: string,
  searchFields: (keyof T)[]
) => {
  return useMemo(() => {
    if (!searchTerm) return data;
    
    const lowerSearch = searchTerm.toLowerCase();
    return data.filter(item =>
      searchFields.some(field => {
        const value = item[field];
        return value && String(value).toLowerCase().includes(lowerSearch);
      })
    );
  }, [data, searchTerm, searchFields]);
};

/**
 * Memoized event handler creator
 */
export const useEventHandler = <T extends (...args: any[]) => any>(
  handler: T,
  deps: any[]
): T => {
  return useCallback(handler, deps) as T;
};
